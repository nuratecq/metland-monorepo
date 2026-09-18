import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

async function main() {
  const url = process.env.TURSO_PM_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_PM_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_PM_DATABASE_URL missing");

  const db = createClient({ url, authToken: token });

  // Get first user
  const userRow = await db.execute("SELECT id FROM users LIMIT 1");
  const userId = String((userRow.rows[0] as Record<string, unknown>)?.id ?? "system");
  console.log(`Seeding notifications for user: ${userId}`);

  // Get a project id for entity links
  const projRow = await db.execute("SELECT id FROM projects LIMIT 1");
  const projectId = String((projRow.rows[0] as Record<string, unknown>)?.id ?? "");

  const now = Date.now();
  const hour = 3_600_000;
  const day = 86_400_000;

  const seeds = [
    // Today — unread
    {
      type: "Task Assigned",
      title: "Task baru ditetapkan ke kamu",
      body: "Ahmad Fauzi menugaskan task 'Review desain UI dashboard' ke kamu.",
      entity_type: "project",
      entity_id: projectId || null,
      is_read: 0,
      created_at: new Date(now - 1 * hour).toISOString(),
    },
    {
      type: "Milestone Update",
      title: "Milestone Phase 1 hampir selesai",
      body: "Progress milestone 'Phase 1 – Foundation' sudah mencapai 90%.",
      entity_type: "milestone",
      entity_id: null,
      is_read: 0,
      created_at: new Date(now - 3 * hour).toISOString(),
    },
    {
      type: "Approval Requested",
      title: "Permintaan persetujuan dokumen",
      body: "Siti Rahayu meminta persetujuan untuk 'RAB Proyek Gedung B'.",
      entity_type: "approval",
      entity_id: null,
      is_read: 0,
      created_at: new Date(now - 5 * hour).toISOString(),
    },
    // Yesterday — read
    {
      type: "Task Comment",
      title: "Komentar baru di task kamu",
      body: "Budi Santoso mengomentari: 'Mohon update progress-nya ya.'",
      entity_type: "task",
      entity_id: null,
      is_read: 1,
      created_at: new Date(now - 1 * day - 2 * hour).toISOString(),
    },
    {
      type: "Approval Requested",
      title: "Dokumen disetujui",
      body: "Dokumen 'Spesifikasi Teknis v2' telah disetujui oleh Direktur.",
      entity_type: "approval",
      entity_id: null,
      is_read: 1,
      created_at: new Date(now - 1 * day - 6 * hour).toISOString(),
    },
    {
      type: "Milestone Update",
      title: "Milestone baru dibuat",
      body: "Admin menambahkan milestone 'Phase 2 – Development' di proyek kamu.",
      entity_type: "milestone",
      entity_id: null,
      is_read: 1,
      created_at: new Date(now - 1 * day - 10 * hour).toISOString(),
    },
    // 2-3 days ago — read
    {
      type: "Task Assigned",
      title: "Kamu dipindahkan ke project baru",
      body: "Kamu sekarang menjadi anggota proyek 'Renovasi Gedung Utama'.",
      entity_type: "project",
      entity_id: projectId || null,
      is_read: 1,
      created_at: new Date(now - 2 * day - 3 * hour).toISOString(),
    },
    {
      type: "General",
      title: "Sistem pemeliharaan terjadwal",
      body: "Sistem akan offline untuk maintenance pada Sabtu 22:00–23:00 WIB.",
      entity_type: null,
      entity_id: null,
      is_read: 1,
      created_at: new Date(now - 3 * day - 1 * hour).toISOString(),
    },
  ];

  // Clear previous dummy notifications for this user
  await db.execute({
    sql: "DELETE FROM notifications WHERE user_id = ?",
    args: [userId],
  });

  for (const s of seeds) {
    await db.execute({
      sql: `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), userId, s.type, s.title, s.body, s.entity_type, s.entity_id, s.is_read, s.created_at],
    });
  }

  console.log(`✓ Inserted ${seeds.length} notifications for user ${userId}`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
