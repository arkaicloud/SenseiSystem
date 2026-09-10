import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";

export type DatabaseCopyStatus = "running" | "success" | "error";

export interface DatabaseCopyJob {
  id: string;
  status: DatabaseCopyStatus;
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

const jobs = new Map<string, DatabaseCopyJob>();
let activeJobId: string | null = null;

function safeErrorMessage(value: unknown): string {
  const message = value instanceof Error ? value.message : String(value);
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[DATABASE_URL_REDACTED]")
    .replace(/password\s*=\s*[^\s]+/gi, "password=[REDACTED]")
    .slice(0, 1000);
}

function normalizedDatabaseIdentity(rawUrl: string): string {
  const url = new URL(rawUrl);
  const port = url.port || "5432";
  return `${url.hostname.toLowerCase()}:${port}${url.pathname}`;
}

export function validateDatabaseCopyEnvironment(env: NodeJS.ProcessEnv = process.env): {
  sourceUrl: string;
  destinationUrl: string;
} {
  if (env.NODE_ENV === "production") {
    throw new Error("Esta operação só pode ser executada no ambiente de desenvolvimento.");
  }

  const sourceUrl = env.PROD_DATABASE_URL;
  const destinationUrl = env.DATABASE_URL;

  if (!sourceUrl) {
    throw new Error("O banco de produção não está configurado.");
  }
  if (!destinationUrl) {
    throw new Error("O banco de desenvolvimento não está configurado.");
  }

  let sourceIdentity: string;
  let destinationIdentity: string;
  try {
    sourceIdentity = normalizedDatabaseIdentity(sourceUrl);
    destinationIdentity = normalizedDatabaseIdentity(destinationUrl);
  } catch {
    throw new Error("A configuração de um dos bancos é inválida.");
  }

  if (sourceIdentity === destinationIdentity) {
    throw new Error("A origem e o destino não podem ser o mesmo banco.");
  }

  return { sourceUrl, destinationUrl };
}

function runPostgresCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "ignore", "pipe"],
      env: process.env,
    });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      if (stderr.length < 8000) stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${command} encerrou com código ${code}: ${safeErrorMessage(stderr)}`));
    });
  });
}

async function assertDifferentDatabaseServers(
  sourceUrl: string,
  destinationUrl: string,
): Promise<void> {
  const sourcePool = new pg.Pool({ connectionString: sourceUrl, max: 1 });
  const destinationPool = new pg.Pool({
    connectionString: destinationUrl,
    max: 1,
  });

  try {
    const identityQuery = `
      SELECT
        current_database() AS database_name,
        COALESCE(inet_server_addr()::text, '') AS server_address,
        COALESCE(inet_server_port(), 5432) AS server_port
    `;
    const [source, destination] = await Promise.all([
      sourcePool.query(identityQuery),
      destinationPool.query(identityQuery),
    ]);
    const sourceIdentity = source.rows[0];
    const destinationIdentity = destination.rows[0];

    if (
      sourceIdentity.database_name === destinationIdentity.database_name &&
      sourceIdentity.server_address === destinationIdentity.server_address &&
      sourceIdentity.server_port === destinationIdentity.server_port
    ) {
      throw new Error("A origem e o destino não podem ser o mesmo banco.");
    }
  } finally {
    await Promise.allSettled([sourcePool.end(), destinationPool.end()]);
  }
}

async function replaceDevelopmentDatabase(
  sourceUrl: string,
  destinationUrl: string,
): Promise<void> {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "sensei-db-copy-"));
  const productionDumpPath = path.join(temporaryDirectory, "production.dump");
  const developmentDumpPath = path.join(temporaryDirectory, "development.dump");
  let cleanupStarted = false;
  let productionRestored = false;

  try {
    await assertDifferentDatabaseServers(sourceUrl, destinationUrl);

    await runPostgresCommand("pg_dump", [
      "--format=custom",
      "--schema=public",
      "--no-owner",
      "--no-privileges",
      "--file",
      productionDumpPath,
      sourceUrl,
    ]);

    await runPostgresCommand("pg_dump", [
      "--format=custom",
      "--schema=public",
      "--no-owner",
      "--no-privileges",
      "--file",
      developmentDumpPath,
      destinationUrl,
    ]);

    cleanupStarted = true;
    await resetPublicSchema(destinationUrl);

    await runPostgresCommand("pg_restore", [
      "--exit-on-error",
      "--no-owner",
      "--no-privileges",
      "--dbname",
      destinationUrl,
      productionDumpPath,
    ]);
    productionRestored = true;

    await runPostgresCommand("./node_modules/.bin/drizzle-kit", [
      "push",
      "--force",
    ]);
  } catch (error) {
    if (cleanupStarted && !productionRestored) {
      try {
        await resetPublicSchema(destinationUrl);
        await runPostgresCommand("pg_restore", [
          "--exit-on-error",
          "--no-owner",
          "--no-privileges",
          "--dbname",
          destinationUrl,
          developmentDumpPath,
        ]);
      } catch (recoveryError) {
        console.error(
          "[database-copy] Falha ao restaurar o backup de segurança:",
          safeErrorMessage(recoveryError),
        );
      }
    }
    throw error;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function resetPublicSchema(destinationUrl: string): Promise<void> {
  const cleanupPool = new pg.Pool({
    connectionString: destinationUrl,
    max: 1,
  });
  try {
    await cleanupPool.query("DROP SCHEMA IF EXISTS public CASCADE");
  } finally {
    await cleanupPool.end();
  }
}

async function executeJob(
  job: DatabaseCopyJob,
  sourceUrl: string,
  destinationUrl: string,
): Promise<void> {
  try {
    await replaceDevelopmentDatabase(sourceUrl, destinationUrl);
    job.status = "success";
  } catch (error) {
    job.status = "error";
    job.error = "Não foi possível copiar o banco. Verifique a configuração e tente novamente.";
    console.error("[database-copy] Falha na cópia:", safeErrorMessage(error));
  } finally {
    job.finishedAt = new Date().toISOString();
    if (activeJobId === job.id) activeJobId = null;
  }
}

export function startDatabaseCopy(): DatabaseCopyJob {
  assertNoDatabaseCopyInProgress(activeJobId);

  const { sourceUrl, destinationUrl } = validateDatabaseCopyEnvironment();
  const job: DatabaseCopyJob = {
    id: randomUUID(),
    status: "running",
    startedAt: new Date().toISOString(),
  };

  activeJobId = job.id;
  jobs.set(job.id, job);
  void executeJob(job, sourceUrl, destinationUrl);
  return { ...job };
}

export function assertNoDatabaseCopyInProgress(currentJobId: string | null): void {
  if (currentJobId) {
    throw new Error("Já existe uma cópia de banco em andamento.");
  }
}

export function getDatabaseCopyJob(jobId: string): DatabaseCopyJob | undefined {
  const job = jobs.get(jobId);
  return job ? { ...job } : undefined;
}

export function isDatabaseCopyConfigured(): boolean {
  try {
    validateDatabaseCopyEnvironment();
    return true;
  } catch {
    return false;
  }
}