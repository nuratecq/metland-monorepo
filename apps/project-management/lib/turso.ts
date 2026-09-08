import { createTursoClient, type DbClient } from "@metland/db/client";

export function resolveDbUrl(env: Partial<NodeJS.ProcessEnv>, isProduction: boolean): string {
  const url = env.TURSO_PM_DATABASE_URL ?? env.TURSO_DATABASE_URL;
  if (url) return url;
  if (isProduction) {
    throw new Error("TURSO_PM_DATABASE_URL (or TURSO_DATABASE_URL) must be set in production");
  }
  return "file:./data/pm.db";
}

// Singleton — one client per process. Turso rate-limits on connections per
// second; creating a new client per request exhausts the quota quickly.
let _db: DbClient | null = null;

export function getDb(): DbClient {
  if (!_db) {
    _db = createTursoClient({
      url: resolveDbUrl(process.env, process.env.NODE_ENV === "production"),
      authToken: process.env.TURSO_PM_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}
