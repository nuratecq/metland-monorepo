import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const projects = [
  {
    code: "PRJ-MENTENG",
    name: "Metland Menteng",
    desc: "Township premium 30Ha di Jakarta Timur — Completely Connected MRT, clusters Neora & Conifera & Goldenrod, konsep Green Connected Living",
    location: "Jakarta Timur, DKI Jakarta",
    type: "Township",
    start: "2022-03-01",
    planned: "2026-12-31",
    status: "ACTIVE",
    progress: 68,
    health: "GREEN" as const,
  },
  {
    code: "PRJ-CIBITUNG",
    name: "Metland Cibitung",
    desc: "Kota mandiri 226Ha CBD & TOD — 0 KM Stasiun KRL Telaga Murni, Millenia City 40Ha, clusters Barcelona Cove & Havana Breeze & Almeria",
    location: "Cibitung, Kab. Bekasi",
    type: "Township",
    start: "2020-01-15",
    planned: "2027-06-30",
    status: "ACTIVE",
    progress: 75,
    health: "GREEN" as const,
  },
  {
    code: "PRJ-CIKARANG",
    name: "Metland Cikarang",
    desc: "Eco Living Township 185Ha pengambangan Metland Cibitung — jembatan CBL, Weston Gateway commercial, harmonisasi teknologi & alam",
    location: "Cikarang, Kab. Bekasi",
    type: "Township",
    start: "2023-05-27",
    planned: "2028-12-31",
    status: "ACTIVE",
    progress: 35,
    health: "YELLOW" as const,
  },
  {
    code: "PRJ-KERTAJATI",
    name: "Metland Kertajati",
    desc: "Mixed-use 310Ha koridor timur Rebana — hunian, shophouses, Sava Terra, Metland Smara Hotel Kertajati",
    location: "Kertajati, Majalengka",
    type: "Mixed-Use",
    start: "2024-10-01",
    planned: "2030-12-31",
    status: "PLANNED",
    progress: 20,
    health: "YELLOW" as const,
  },
  {
    code: "PRJ-CYBERPURI",
    name: "Metland Cyber Puri",
    desc: "Perumahan established di Tangerang — penyumbang pendapatan 2024, kawasan matang",
    location: "Tangerang, Banten",
    type: "Township",
    start: "2018-06-01",
    planned: "2025-12-31",
    status: "ACTIVE",
    progress: 82,
    health: "GREEN" as const,
  },
  {
    code: "PRJ-TRANSYOGI",
    name: "Metland Transyogi",
    desc: "Kota mandiri Cibubur — cluster Walden terbaru, akses tol JORR",
    location: "Cileungsi/Cibubur, Kab. Bogor",
    type: "Township",
    start: "2019-03-10",
    planned: "2026-06-30",
    status: "ACTIVE",
    progress: 60,
    health: "GREEN" as const,
  },
  {
    code: "PRJ-CILEUNGSI",
    name: "Metland Cileungsi",
    desc: "Perumahan di Bogor Timur — dekat Metropolitan Mall Cileungsi",
    location: "Cileungsi, Kab. Bogor",
    type: "Township",
    start: "2017-08-01",
    planned: "2026-03-31",
    status: "ACTIVE",
    progress: 45,
    health: "YELLOW" as const,
  },
  {
    code: "PRJ-PURI",
    name: "Metland Puri",
    desc: "Residential Tangerang + One District at Puri commercial block — completed",
    location: "Tangerang, Banten",
    type: "Township",
    start: "2015-01-01",
    planned: "2023-12-31",
    status: "COMPLETED",
    progress: 100,
    health: "GREEN" as const,
  },
  {
    code: "PRJ-GAVENUE",
    name: "Grand Metropolitan GAVEnue",
    desc: "Perluasan Grand Metropolitan Bekasi — mall expansion target selesai S1 2026, recurring income",
    location: "Bekasi, Jawa Barat",
    type: "Commercial-Mall",
    start: "2024-01-10",
    planned: "2026-06-30",
    status: "ACTIVE",
    progress: 55,
    health: "YELLOW" as const,
  },
  {
    code: "PRJ-MGOLD",
    name: "M Gold Tower & Kaliana Apartment",
    desc: "High-rise apartemen & office Bekasi — M Gold Tower first in Bekasi + Kaliana Apartment",
    location: "Bekasi, Jawa Barat",
    type: "High-Rise",
    start: "2021-09-01",
    planned: "2026-09-30",
    status: "ON_HOLD",
    progress: 40,
    health: "RED" as const,
  },
];

const milestoneTemplates = [
  { name: "Land Acquisition & Permits", pct: 100, status: "DONE" },
  { name: "Infrastructure & Roads", pct: 80, status: "IN_PROGRESS" },
  { name: "Structure", pct: 50, status: "IN_PROGRESS" },
  { name: "Finishing & Landscape", pct: 20, status: "TODO" },
  { name: "Handover & Commercial", pct: 0, status: "TODO" },
];

const taskTemplates = [
  { title: "Pematangan lahan Cluster A", priority: "HIGH" as const },
  { title: "Pembangunan drainase & jalan utama", priority: "CRITICAL" as const },
  { title: "Pondasi & struktur ruko", priority: "HIGH" as const },
  { title: "Instalasi MEP kawasan", priority: "MEDIUM" as const },
  { title: "Finishing facade & landscape", priority: "MEDIUM" as const },
];

async function main() {
  const url = process.env.TURSO_PM_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_PM_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO URL missing");
  const db = createClient({ url, authToken: token });

  // ensure schema exists (reuse pmSchema)
  const { pmSchemaSql } = await import("./pm.js");
  for (const stmt of pmSchemaSql.split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.execute(stmt);
  }
  console.log("[seed-real] schema ensured");

  for (const p of projects) {
    const id = randomUUID();
    const now = new Date().toISOString();
    // upsert by code
    const existing = await db.execute({ sql: "SELECT id FROM projects WHERE project_code = ?", args: [p.code] });
    let pid = id;
    if (existing.rows.length) {
      pid = String((existing.rows[0] as unknown as Record<string, string>).id);
      await db.execute({
        sql: "UPDATE projects SET name=?, description=?, location_text=?, start_date=?, planned_end_date=?, status=?, progress=?, health_status=?, updated_at=? WHERE id=?",
        args: [p.name, p.desc, p.location, p.start, p.planned, p.status, p.progress, p.health, now, pid],
      });
      console.log(`[seed-real] updated ${p.code}`);
    } else {
      await db.execute({
        sql: `INSERT INTO projects (id, project_code, name, description, location_text, start_date, planned_end_date, status, progress, health_status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [pid, p.code, p.name, p.desc, p.location, p.start, p.planned, p.status, p.progress, p.health, now, now],
      });
      console.log(`[seed-real] inserted ${p.code} -> ${pid}`);
    }

    // milestones (idempotent by name+project)
    for (const mt of milestoneTemplates) {
      const mExist = await db.execute({ sql: "SELECT id FROM milestones WHERE project_id=? AND name=?", args: [pid, mt.name] });
      if (mExist.rows.length) continue;
      const mid = randomUUID();
      const due =
        p.status === "COMPLETED" ? p.planned : p.status === "PLANNED" ? "2026-12-31" : mt.pct === 100 ? p.start : p.planned;
      await db.execute({
        sql: `INSERT INTO milestones (id, project_id, name, completion_percentage, status, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [mid, pid, mt.name, mt.pct, mt.status, due, now, now],
      });
    }

    // tasks
    const taskExist = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM tasks WHERE project_id=?", args: [pid] });
    if (Number((taskExist.rows[0] as unknown as Record<string, number>).cnt) === 0) {
      for (const t of taskTemplates) {
        const tid = randomUUID();
        const due = p.planned;
        const status = p.status === "COMPLETED" ? "DONE" : p.status === "ON_HOLD" ? "BLOCKED" : "IN_PROGRESS";
        await db.execute({
          sql: `INSERT INTO tasks (id, project_id, title, priority, status, progress, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [tid, pid, t.title, t.priority, status, p.progress > 50 ? 60 : 30, due, now, now],
        });
      }
    }

    // sample issue for Cibitung & GAVEnue
    if (p.code === "PRJ-CIBITUNG" || p.code === "PRJ-GAVENUE") {
      const issExist = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM issues WHERE project_id=?", args: [pid] });
      if (Number((issExist.rows[0] as unknown as Record<string, number>).cnt) === 0) {
        const iid = randomUUID();
        await db.execute({
          sql: `INSERT INTO issues (id, project_id, title, description, severity, status, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            iid,
            pid,
            p.code === "PRJ-CIBITUNG" ? "Jembatan CBL Cibitung-Cikarang progress 60%" : "GAVEnue tenant fit-out delay",
            "Follow up kontraktor & perizinan",
            "HIGH",
            "OPEN",
            "2026-09-30",
            now,
            now,
          ],
        });
      }
    }
  }

  const cnt = await db.execute("SELECT COUNT(*) as cnt FROM projects");
  console.log("[seed-real] total projects", cnt.rows[0].cnt);
  const ms = await db.execute("SELECT COUNT(*) as cnt FROM milestones");
  console.log("[seed-real] total milestones", ms.rows[0].cnt);
  const ts = await db.execute("SELECT COUNT(*) as cnt FROM tasks");
  console.log("[seed-real] total tasks", ts.rows[0].cnt);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
