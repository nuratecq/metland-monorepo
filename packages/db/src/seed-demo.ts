import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { pmPermissions, cataloguePermissions, seedPermissions } from "./seed.js";

async function seedRoles(
  db: ReturnType<typeof createClient>,
  roles: { name: string; permissions: string[] }[]
) {
  for (const role of roles) {
    const existing = await db.execute({ sql: "SELECT id FROM roles WHERE name = ?", args: [role.name] });
    const roleId = existing.rows.length ? String((existing.rows[0] as unknown as Record<string, string>).id) : randomUUID();
    if (!existing.rows.length) {
      await db.execute({ sql: "INSERT INTO roles (id, name) VALUES (?, ?)", args: [roleId, role.name] });
    }
    for (const permName of role.permissions) {
      const perm = await db.execute({ sql: "SELECT id FROM permissions WHERE name = ?", args: [permName] });
      if (!perm.rows.length) continue;
      const permId = String((perm.rows[0] as unknown as Record<string, string>).id);
      await db.execute({
        sql: "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
        args: [roleId, permId],
      });
    }
  }
}

async function assignRole(db: ReturnType<typeof createClient>, userId: string, roleName: string) {
  const role = await db.execute({ sql: "SELECT id FROM roles WHERE name = ?", args: [roleName] });
  if (!role.rows.length) return;
  const roleId = String((role.rows[0] as unknown as Record<string, string>).id);
  await db.execute({ sql: "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)", args: [userId, roleId] });
}

async function main() {
  const url = process.env.TURSO_PM_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_PM_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO URL missing");
  const db = createClient({ url, authToken: token });
  const cUrl = process.env.TURSO_CATALOGUE_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const cToken = process.env.TURSO_CATALOGUE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  const cdb = cUrl === url && cToken === token ? db : createClient({ url: cUrl ?? url, authToken: cToken ?? token });

  const now = new Date().toISOString();

  // Seed password. Override per environment; the fallback exists so a local
  // `pnpm seed` works without setup, and is refused outside development.
  const seedPassword = process.env.SEED_PASSWORD ?? "Demo1234";
  if (!process.env.SEED_PASSWORD && process.env.NODE_ENV === "production") {
    throw new Error("SEED_PASSWORD must be set when seeding a production database");
  }
  if (seedPassword.length < 8) throw new Error("SEED_PASSWORD must be at least 8 characters");
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  // ensure demo users exist (FK). Re-running resets the password to the current
  // seed value so a rotated SEED_PASSWORD actually takes effect.
  for (const u of [{id:"demo-user", email:"demo@metland.co.id", name:"Demo User"}, {id:"manager-1", email:"manager@metland.co.id", name:"Manager"}, {id:"procurement-1", email:"procurement@metland.co.id", name:"Procurement"}]) {
    for (const target of cdb !== db ? [db, cdb] : [db]) {
      const ex = await target.execute({ sql: "SELECT id FROM users WHERE id=?", args: [u.id] });
      if (ex.rows.length) {
        await target.execute({ sql: "UPDATE users SET password_hash=? WHERE id=?", args: [passwordHash, u.id] });
      } else {
        await target.execute({
          sql: "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
          args: [u.id, u.email, u.name, passwordHash],
        });
      }
    }
  }

  // Roles & permissions — required so requirePerm() (packages/auth/src/permissions.ts) actually grants access
  await seedPermissions(db, pmPermissions);
  const pmReadPerms = pmPermissions.filter((p) => p.endsWith(".read"));
  await seedRoles(db, [
    { name: "Project Manager", permissions: pmPermissions },
    { name: "Viewer", permissions: pmReadPerms },
  ]);
  await assignRole(db, "demo-user", "Project Manager");
  await assignRole(db, "manager-1", "Project Manager");

  if (cdb !== db) {
    await seedPermissions(cdb, cataloguePermissions);
  }
  const catalogueReadPerms = cataloguePermissions.filter((p) => p.endsWith(".read"));
  await seedRoles(cdb, [
    { name: "Procurement", permissions: cataloguePermissions },
    { name: "Viewer", permissions: catalogueReadPerms },
  ]);
  await assignRole(cdb, "procurement-1", "Procurement");
  console.log("[seed-demo] roles seeded: Project Manager, Viewer (PM); Procurement, Viewer (Catalogue)");

  // PM approvals
  const projs = await db.execute("SELECT id, project_code, name FROM projects LIMIT 3");
  for (const p of projs.rows as unknown as {id:string,project_code:string,name:string}[]) {
    const exist = await db.execute({ sql: "SELECT id FROM approvals WHERE entity_id=?", args: [p.id] });
    if (exist.rows.length) continue;
    const aid = randomUUID();
    const status = p.project_code === "PRJ-MENTENG" ? "APPROVED" : p.project_code === "PRJ-CIBITUNG" ? "SUBMITTED" : "IN_REVIEW";
    await db.execute({ sql: `INSERT INTO approvals (id, entity_type, entity_id, requester_id, status, reason, created_at, updated_at) VALUES (?, 'project', ?, 'demo-user', ?, ?, ?, ?)`, args: [aid, p.id, status, `Approval ${p.project_code} — ${p.name}`, now, now] });
    if (status === "APPROVED") {
      await db.execute({ sql: `INSERT INTO approval_actions (id, approval_id, approver_id, decision, comment, created_at) VALUES (?, ?, ?, 'APPROVED', 'Disetujui — sesuai budget', ?)`, args: [randomUUID(), aid, "manager-1", now] });
    }
    console.log(`[seed-demo] PM approval ${p.project_code} ${status}`);
  }

  // Notifications
  const notifs = [
    { type: "Task Assigned", title: "Task Assigned: Pematangan lahan Cluster A", body: "PRJ-CIBITUNG • Due 2026-09-15" },
    { type: "Milestone Due", title: "Milestone Due: Infrastructure & Roads 80%", body: "PRJ-MENTENG • Due 2026-09-30" },
    { type: "Approval Requested", title: "Approval Requested PRJ-GAVENUE", body: "GAVEnue tenant fit-out — perlu review" },
  ];
  for (const n of notifs) {
    const ex = await db.execute({ sql: "SELECT id FROM notifications WHERE title=?", args: [n.title] });
    if (ex.rows.length) continue;
    await db.execute({ sql: `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, is_read, created_at) VALUES (?, 'demo-user', ?, ?, ?, 'project', 'demo', 0, ?)`, args: [randomUUID(), n.type, n.title, n.body, now] });
    console.log(`[seed-demo] notification ${n.title}`);
  }

  // Catalogue: ensure recommendation + approval_request
  const recs = await cdb.execute("SELECT id FROM recommendations LIMIT 1");
  let recId: string;
  if (!recs.rows.length) {
    recId = randomUUID();
    await cdb.execute({ sql: `INSERT INTO recommendations (id, query, query_intent, results, created_at) VALUES (?, ?, ?, ?, ?)`, args: [recId, "Cari kontraktor struktur high rise", JSON.stringify({ specialization: "Structure" }), JSON.stringify([{ id: "WIKA-001" }]), now] });
    console.log(`[seed-demo] recommendation ${recId}`);
  } else recId = String((recs.rows[0] as unknown as Record<string,string>).id);

  const appEx = await cdb.execute({ sql: "SELECT id FROM approval_requests WHERE recommendation_id=?", args: [recId] });
  if (!appEx.rows.length) {
    const aid = randomUUID();
    await cdb.execute({ sql: `INSERT INTO approval_requests (id, recommendation_id, requester_id, reason, status, created_at, updated_at) VALUES (?, ?, 'procurement-1', 'Pilih WIKA untuk high-rise Bekasi', 'SUBMITTED', ?, ?)`, args: [aid, recId, now, now] });
    console.log(`[seed-demo] catalogue approval ${aid}`);
  }

  const cntA = await db.execute("SELECT COUNT(*) as cnt FROM approvals");
  console.log("[seed-demo] approvals", cntA.rows[0].cnt);
  const cntN = await db.execute("SELECT COUNT(*) as cnt FROM notifications");
  console.log("[seed-demo] notifications", cntN.rows[0].cnt);
  const cntR = await cdb.execute("SELECT COUNT(*) as cnt FROM approval_requests");
  console.log("[seed-demo] catalogue approval_requests", cntR.rows[0].cnt);
}

main().catch(e=>{console.error(e); process.exit(1);});
