import { createTursoClient } from "@metland/db/client";

export function resolveDbUrl(env: Partial<NodeJS.ProcessEnv>, isProduction: boolean): string {
  const url = env.TURSO_CATALOGUE_DATABASE_URL ?? env.TURSO_DATABASE_URL;
  if (url) return url;
  if (isProduction) {
    throw new Error("TURSO_CATALOGUE_DATABASE_URL (or TURSO_DATABASE_URL) must be set in production");
  }
  return "file:./data/catalogue.db";
}

export function getDb() {
  return createTursoClient({
    url: resolveDbUrl(process.env, process.env.NODE_ENV === "production"),
    authToken: process.env.TURSO_CATALOGUE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  });
}
