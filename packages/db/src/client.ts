import { createClient } from "@libsql/client";

export type DbClient = ReturnType<typeof createClient>;

export function createTursoClient(opts: { url: string; authToken?: string }): DbClient {
  if (!opts.url) throw new Error("TURSO_DATABASE_URL is required");
  return createClient({ url: opts.url, authToken: opts.authToken });
}

// Helpers to get per-app clients from env
export function getPmClient(): DbClient {
  return createTursoClient({
    url: process.env.TURSO_PM_DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "",
    authToken: process.env.TURSO_PM_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  });
}

export function getCatalogueClient(): DbClient {
  return createTursoClient({
    url: process.env.TURSO_CATALOGUE_DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "",
    authToken: process.env.TURSO_CATALOGUE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  });
}
