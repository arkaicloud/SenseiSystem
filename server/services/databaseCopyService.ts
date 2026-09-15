import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
const DATABASE_COPY_ADVISORY_LOCK_KEY = 1_735_916_247;

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

function runPostgresCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      if (stderr.length < 8000) stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve(stdout);
      reject(new Error(`${command} encerrou com código ${code}: ${safeErrorMessage(stderr)}`));
    });
  });
}

function shouldExcludeFromRestoreList(line: string): boolean {
  return (
    line.includes(" SCHEMA - public ") ||
    line.includes(" COMMENT - SCHEMA public ") ||
    line.includes(" TABLE public session ") ||
    line.includes(" TABLE DATA public session ") ||
    line.includes(" CONSTRAINT public session ") ||
    line.includes(" INDEX public IDX_session_")
  );
}

export function filterSafeRestoreList(restoreList: string): string {
  return restoreList
    .split("\n")
    .filter((line) => !shouldExcludeFromRestoreList(line))
    .join("\n");
}

async function createSafeRestoreList(
  dumpPath: string,
  listPath: string,
): Promise<void> {
  const restoreList = await runPostgresCommand("pg_restore", ["--list", dumpPath]);
  const filteredList = filterSafeRestoreList(restoreList);
  await writeFile(listPath, filteredList, "utf8");
}

async function restorePublicData(
  destinationUrl: string,
  dumpPath: string,
  listPath: string,
): Promise<void> {
  await createSafeRestoreList(dumpPath, listPath);
  await runPostgresCommand("pg_restore", [
    "--clean",
    "--if-exists",
    "--exit-on-error",
    "--no-owner",
    "--no-privileges",
    "--use-list",
    listPath,
    "--dbname",
    destinationUrl,
    dumpPath,
  ]);
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

async function ensureDevelopmentSessionTable(
  destinationUrl: string,
): Promise<void> {
  const sessionPool = new pg.Pool({ connectionString: destinationUrl, max: 1 });
  try {
    await sessionPool.query(`
      CREATE TABLE IF NOT EXISTS public."session" (
        sid varchar NOT NULL COLLATE "default",
        sess json NOT NULL,
        expire timestamp(6) NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid)
      )
    `);
    await sessionPool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire"
      ON public."session" (expire)
    `);
  } finally {
    await sessionPool.end();
  }
}

async function resetPublicSchema(destinationUrl: string): Promise<void> {
  const cleanupPool = new pg.Pool({ connectionString: destinationUrl, max: 1 });
  try {
    await cleanupPool.query(`
      BEGIN;
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      COMMIT;
    `);
  } finally {
    await cleanupPool.end();
  }
}

async function replaceDevelopmentDatabase(
  sourceUrl: string,
  destinationUrl: string,
): Promise<void> {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "sensei-db-copy-"));
  const productionDumpPath = path.join(temporaryDirectory, "production.dump");
  const developmentDumpPath = path.join(temporaryDirectory, "development.dump");
  const productionListPath = path.join(temporaryDirectory, "production.list");
  const developmentListPath = path.join(temporaryDirectory, "development.list");
  let replacementStarted = false;
  let replacementCompleted = false;
  let recoveryFailed = false;
  const lockPool = new pg.Pool({ connectionString: destinationUrl, max: 1 });
  let lockClient: pg.PoolClient | null = null;
  let lockAcquired = false;

  try {
    lockClient = await lockPool.connect();
    await assertDifferentDatabaseServers(sourceUrl, destinationUrl);
    const lockResult = await lockClient.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS acquired",
      [DATABASE_COPY_ADVISORY_LOCK_KEY],
    );
    lockAcquired = lockResult.rows[0]?.acquired === true;
    if (!lockAcquired) {
      throw new Error("Já existe uma cópia de banco em andamento em outra instância.");
    }

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

    replacementStarted = true;
    await restorePublicData(
      destinationUrl,
      productionDumpPath,
      productionListPath,
    );

    await runPostgresCommand("./node_modules/.bin/drizzle-kit", [
      "push",
      "--force",
    ]);
    await ensureDevelopmentSessionTable(destinationUrl);
    replacementCompleted = true;
  } catch (error) {
    if (replacementStarted && !replacementCompleted) {
      try {
        await resetPublicSchema(destinationUrl);
        await restorePublicData(
          destinationUrl,
          developmentDumpPath,
          developmentListPath,
        );
        await ensureDevelopmentSessionTable(destinationUrl);
      } catch (recoveryError) {
        recoveryFailed = true;
        console.error(
          "[database-copy] Falha ao restaurar o backup de segurança:",
          safeErrorMessage(recoveryError),
        );
        console.error(
          `[database-copy] Backup de segurança preservado em ${temporaryDirectory}`,
        );
      }
    }
    throw error;
  } finally {
    if (lockAcquired && lockClient) {
      await lockClient.query("SELECT pg_advisory_unlock($1)", [
        DATABASE_COPY_ADVISORY_LOCK_KEY,
      ]);
    }
    lockClient?.release();
    await lockPool.end();
    if (!recoveryFailed) {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
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

export async function acquireDatabaseMutationPermit(): Promise<
  (() => Promise<void>) | null
> {
  const destinationUrl = process.env.DATABASE_URL;
  if (!destinationUrl) {
    throw new Error("O banco de desenvolvimento não está configurado.");
  }

  const client = new pg.Client({ connectionString: destinationUrl });
  await client.connect();

  try {
    const lockResult = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock_shared($1) AS acquired",
      [DATABASE_COPY_ADVISORY_LOCK_KEY],
    );
    if (lockResult.rows[0]?.acquired !== true) {
      await client.end();
      return null;
    }
  } catch (error) {
    await client.end();
    throw error;
  }

  let released = false;
  return async () => {
    if (released) return;
    released = true;
    try {
      await client.query("SELECT pg_advisory_unlock_shared($1)", [
        DATABASE_COPY_ADVISORY_LOCK_KEY,
      ]);
    } finally {
      await client.end();
    }
  };
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

export function shouldGuardDatabaseMutation(
  method: string,
  requestPath: string,
  copyConfigured: boolean,
): boolean {
  if (!copyConfigured) return false;
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return false;
  return !(
    method === "POST" &&
    requestPath === "/api/admin/database/prod-to-dev"
  );
}