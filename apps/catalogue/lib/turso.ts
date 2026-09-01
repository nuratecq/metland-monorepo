import { createTursoClient } from "@metland/db/client";

export function getDb() {
  return createTursoClient({
    url: process.env.TURSO_CATALOGUE_DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./data/catalogue.db",
    authToken: process.env.TURSO_CATALOGUE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  });
}
