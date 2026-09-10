import type { Request } from "express";
import { and, desc, eq, gte, ilike, lt } from "drizzle-orm";
import { db } from "../db";
import { systemLogs, type InsertSystemLog } from "@shared/schema";

const RETENTION_DAYS = 90;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_STACK_LENGTH = 12_000;
const MAX_METADATA_LENGTH = 8_000;

const SENSITIVE_KEY = /password|senha|token|secret|authorization|cookie|api.?key|cpf|rg|email|phone|signature/i;
const CREDENTIAL_VALUE = /\b(password|senha|token|secret|authorization|api[_-]?key)\s*[:=]\s*[^\s,;&]+/gi;
const BEARER_VALUE = /(bearer\s+)[^\s]+/gi;
const EMAIL_VALUE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const CPF_VALUE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

let writesSinceCleanup = 0;

function truncate(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function redactText(value: string): string {
  return value
    .replace(BEARER_VALUE, "$1[REDACTED]")
    .replace(CREDENTIAL_VALUE, "$1=[REDACTED]")
    .replace(EMAIL_VALUE, "[EMAIL_REDACTED]")
    .replace(CPF_VALUE, "[CPF_REDACTED]");
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[MAX_DEPTH]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactText(truncate(value, 1_000) || "");
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 50)
        .map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitizeValue(item, depth + 1)]),
    );
  }
  return String(value);
}

function serializeMetadata(metadata?: Record<string, unknown>): string | null {
  if (!metadata) return null;
  try {
    return truncate(JSON.stringify(sanitizeValue(metadata)), MAX_METADATA_LENGTH);
  } catch {
    return JSON.stringify({ serializationError: true });
  }
}

function normalizeError(error: unknown): { name: string | null; message: string; stack: string | null } {
  if (error instanceof Error) {
    return {
      name: truncate(error.name, 150),
      message: truncate(redactText(error.message || "Erro sem mensagem"), MAX_MESSAGE_LENGTH) || "Erro sem mensagem",
      stack: truncate(redactText(error.stack || ""), MAX_STACK_LENGTH),
    };
  }

  return {
    name: null,
    message: truncate(redactText(typeof error === "string" ? error : "Erro desconhecido"), MAX_MESSAGE_LENGTH) || "Erro desconhecido",
    stack: null,
  };
}

export function getRequestLogContext(req: Request) {
  const requestId = typeof resLocalsRequestId(req) === "string" ? resLocalsRequestId(req) : undefined;
  return {
    requestId,
    method: req.method,
    path: req.originalUrl?.split("?")[0] || req.path,
    userId: req.user?.id,
  };
}

function resLocalsRequestId(req: Request): unknown {
  return req.res?.locals?.requestId;
}

async function persist(entry: InsertSystemLog): Promise<void> {
  if (!db) {
    console.error("[system-logger] Banco indisponível; log não persistido.");
    return;
  }

  try {
    await db.insert(systemLogs).values(entry);
    writesSinceCleanup += 1;

    if (writesSinceCleanup >= 100) {
      writesSinceCleanup = 0;
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
      void db.delete(systemLogs).where(lt(systemLogs.createdAt, cutoff)).catch((cleanupError) => {
        console.error("[system-logger] Falha ao limpar logs antigos:", cleanupError);
      });
    }
  } catch (persistenceError) {
    // Never let observability failures break application requests.
    console.error("[system-logger] Falha ao persistir log:", persistenceError);
  }
}

export const systemLogger = {
  async error(error: unknown, context: Partial<InsertSystemLog> & { message?: string } = {}): Promise<void> {
    const normalized = normalizeError(error);
    await persist({
      level: "error",
      source: context.source || "server",
      message: truncate(redactText(context.message || normalized.message), MAX_MESSAGE_LENGTH) || normalized.message,
      errorName: context.errorName || normalized.name,
      stack: context.stack || normalized.stack,
      requestId: context.requestId || null,
      method: context.method || null,
      path: context.path || null,
      statusCode: context.statusCode || 500,
      durationMs: context.durationMs || null,
      userId: context.userId || null,
      metadata: context.metadata ? truncate(redactText(context.metadata), MAX_METADATA_LENGTH) : null,
    });
  },

  async warn(message: string, context: Partial<InsertSystemLog> = {}): Promise<void> {
    await persist({
      level: "warn",
      source: context.source || "server",
      message: truncate(redactText(message), MAX_MESSAGE_LENGTH) || "Aviso sem mensagem",
      requestId: context.requestId || null,
      errorName: context.errorName || null,
      stack: context.stack || null,
      method: context.method || null,
      path: context.path || null,
      statusCode: context.statusCode || null,
      durationMs: context.durationMs || null,
      userId: context.userId || null,
      metadata: context.metadata ? truncate(redactText(context.metadata), MAX_METADATA_LENGTH) : null,
    });
  },
};

export async function getSystemLogs(filters: {
  limit?: number;
  level?: string;
  path?: string;
  since?: Date;
}) {
  if (!db) return [];

  const conditions = [];
  if (filters.level) conditions.push(eq(systemLogs.level, filters.level));
  if (filters.path) conditions.push(ilike(systemLogs.path, `%${filters.path}%`));
  if (filters.since) conditions.push(gte(systemLogs.createdAt, filters.since));

  return db
    .select()
    .from(systemLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(systemLogs.createdAt))
    .limit(Math.min(Math.max(filters.limit || 100, 1), 500));
}

export function buildSafeMetadata(metadata?: Record<string, unknown>): string | null {
  return serializeMetadata(metadata);
}