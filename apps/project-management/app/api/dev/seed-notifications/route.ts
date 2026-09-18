import { NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { randomUUID } from "crypto";

/** DEV ONLY — seed dummy notifications for the first user in DB */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const db = getDb();

  // Get first user
  const userRow = await db.execute("SELECT id FROM users LIMIT 1");
  const userId = String((userRow.rows[0] as Record<string, unknown>)?.id ?? "system");

  // Get a project id for links
  const projRow = await db.execute("SELECT id FROM projects LIMIT 1");
  const projectId = String((projRow.rows[0] as Record<string, unknown>)?.id ?? "");

  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;

  const seeds = [
    // Today
    {
      type: "Task Assigned",
      title: "Task baru ditetapkan ke kamu",
      body: "Ahmad Fauzi menugaskan task 'Review desain UI dashboard' ke kamu.",
      entity_type: "project",
      entity_id: projectId,
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
    // Yesterday
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
      title: "Approval disetujui",
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
    // 2 days ago
    {
      type: "Task Assigned",
      title: "Kamu dipindahkan ke project baru",
      body: "Kamu sekarang menjadi anggota proyek 'Renovasi Gedung Utama'.",
      entity_type: "project",
      entity_id: projectId,
      is_read: 1,
      created_at: new Date(now - 2 * day - 3 * hour).toISOString(),
    },
    {
      type: "General",
      title: "Sistem pemeliharaan terjadwal",
      body: "Sistem akan offline untuk maintenance pada Sabtu 22:00 – 23:00 WIB.",
      entity_type: null,
      entity_id: null,
      is_read: 1,
      created_at: new Date(now - 3 * day - 1 * hour).toISOString(),
    },
  ];

  // Delete old dummy notifications for user
  await db.execute({
    sql: "DELETE FROM notifications WHERE user_id = ? AND type IN ('Task Assigned','Milestone Update','Approval Requested','Task Comment','General')",
    args: [userId] as never[],
  });

  const inserted: string[] = [];
  for (const s of seeds) {
    const id = randomUUID();
    await db.execute({
      sql: `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        userId,
        s.type,
        s.title,
        s.body,
        s.entity_type,
        s.entity_id,
        s.is_read,
        s.created_at,
      ] as never[],
    });
    inserted.push(id);
  }

  return NextResponse.json({
    ok: true,
    user_id: userId,
    inserted: inserted.length,
    message: `Seeded ${inserted.length} dummy notifications for user ${userId}`,
  });
}
