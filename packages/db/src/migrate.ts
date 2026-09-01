import { createClient } from "@libsql/client";
import { migratePm, migrateCatalogue, seedPermissions, pmPermissions, cataloguePermissions } from "./seed.js";

async function main() {
  const target = process.argv[2] ?? "both";
  const pmUrl = process.env.TURSO_PM_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const pmToken = process.env.TURSO_PM_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  const catUrl = process.env.TURSO_CATALOGUE_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const catToken = process.env.TURSO_CATALOGUE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

  if ((target === "pm" || target === "both") && pmUrl) {
    const c = createClient({ url: pmUrl, authToken: pmToken });
    await migratePm(c);
    await seedPermissions(c, pmPermissions);
    console.log("[db] PM migrated + seeded permissions:", pmPermissions.length);
  }
  if ((target === "catalogue" || target === "both") && catUrl) {
    const c = createClient({ url: catUrl, authToken: catToken });
    await migrateCatalogue(c);
    await seedPermissions(c, cataloguePermissions);
    console.log("[db] Catalogue migrated + seeded permissions:", cataloguePermissions.length);
  }
  if (!pmUrl && !catUrl) {
    console.log("[db] No TURSO_* env set — skipping. Provide TURSO_PM_DATABASE_URL etc.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
