/**
 * Sets every user's password to a known value, hashed with bcrypt.
 *
 * Written for the one-off migration off the legacy plaintext `'demo'` value,
 * but safe to re-run: it hashes and overwrites unconditionally.
 *
 *   MIGRATE_PASSWORD='Demo1234' pnpm --filter @metland/db exec tsx src/migrate-passwords.ts
 *
 * Pass --only-legacy to skip rows that already hold a valid bcrypt hash, so a
 * later run cannot clobber passwords real users have since set themselves.
 */
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const BCRYPT_RE = /^\$2[aby]\$\d{2}\$.{53}$/;

async function main() {
  const password = process.env.MIGRATE_PASSWORD;
  if (!password) throw new Error("MIGRATE_PASSWORD must be set");
  if (password.length < 8) throw new Error("MIGRATE_PASSWORD must be at least 8 characters");

  const onlyLegacy = process.argv.includes("--only-legacy");

  const pmUrl = process.env.TURSO_PM_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const pmToken = process.env.TURSO_PM_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  if (!pmUrl) throw new Error("TURSO_PM_DATABASE_URL (or TURSO_DATABASE_URL) missing");
  const cUrl = process.env.TURSO_CATALOGUE_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const cToken = process.env.TURSO_CATALOGUE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

  const shared = cUrl === pmUrl && cToken === pmToken;
  const targets: { label: string; db: ReturnType<typeof createClient> }[] = [
    { label: shared ? "shared" : "pm", db: createClient({ url: pmUrl, authToken: pmToken }) },
  ];
  if (!shared && cUrl) targets.push({ label: "catalogue", db: createClient({ url: cUrl, authToken: cToken }) });

  // One hash for everyone: this is a shared demo credential, not per-user secrets.
  const hash = await bcrypt.hash(password, 10);

  for (const { label, db } of targets) {
    const rs = await db.execute("SELECT id, email, password_hash FROM users ORDER BY email");
    let updated = 0;
    let skipped = 0;
    for (const row of rs.rows as unknown as { id: string; email: string; password_hash: string }[]) {
      if (onlyLegacy && BCRYPT_RE.test(String(row.password_hash ?? ""))) {
        console.log(`  skip   ${row.email} (already bcrypt)`);
        skipped++;
        continue;
      }
      await db.execute({ sql: "UPDATE users SET password_hash = ? WHERE id = ?", args: [hash, row.id] });
      console.log(`  update ${row.email}`);
      updated++;
    }
    console.log(`${label}: ${updated} updated, ${skipped} skipped, ${rs.rows.length} total`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
