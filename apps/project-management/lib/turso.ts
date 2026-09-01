import { createTursoClient } from "@metland/db/client";

export function getDb() {
  return createTursoClient({
    url: process.env.TURSO_PM_DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./data/pm.db",
    authToken: process.env.TURSO_PM_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  });
}
