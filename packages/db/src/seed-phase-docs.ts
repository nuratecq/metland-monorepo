import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const DUMMY_DOCS: { name: string; mime: string; size: number; category: string; status: string }[] = [
  { name: "Data Finance Q3.pdf",         mime: "application/pdf",   size: 1_240_000, category: "Report",             status: "APPROVED" },
  { name: "Site Plan Rev2.pdf",          mime: "application/pdf",   size: 3_800_000, category: "Drawing",            status: "APPROVED" },
  { name: "Schedule Minggu 1.xlsx",      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 480_000, category: "Report", status: "APPROVED" },
  { name: "Material List v1.xlsx",       mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 320_000, category: "Technical Document", status: "UNDER_REVIEW" },
  { name: "Dokumen Kerja Awal.pdf",      mime: "application/pdf",   size: 2_100_000, category: "Contract",           status: "APPROVED" },
  { name: "Progress Tender.pdf",         mime: "application/pdf",   size: 890_000,   category: "Approval",           status: "APPROVED" },
  { name: "Gambar Teknis Rev1.pdf",      mime: "application/pdf",   size: 5_600_000, category: "Drawing",            status: "UNDER_REVIEW" },
  { name: "Foto Progres Lapangan.jpg",   mime: "image/jpeg",        size: 2_300_000, category: "Photo",              status: "DRAFT" },
  { name: "Submit Progress Kerja.pdf",   mime: "application/pdf",   size: 760_000,   category: "Report",             status: "APPROVED" },
  { name: "Material Approval Sheet.pdf", mime: "application/pdf",   size: 430_000,   category: "Approval",           status: "REJECTED" },
];

async function main() {
  const url = process.env.TURSO_PM_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_PM_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_PM_DATABASE_URL missing");

  const db = createClient({ url, authToken: token });

  // Get user
  const userRow = await db.execute("SELECT id FROM users LIMIT 1");
  const userId = String((userRow.rows[0] as Record<string, unknown>)?.id ?? "system");

  // Get tasks that have milestone_id
  const taskRows = await db.execute(
    "SELECT id, milestone_id FROM tasks WHERE milestone_id IS NOT NULL ORDER BY created_at ASC LIMIT 20"
  );

  if (taskRows.rows.length === 0) {
    console.error("No tasks with milestone_id found. Seed milestones + tasks first.");
    process.exit(1);
  }

  console.log(`Found ${taskRows.rows.length} tasks with milestone_id. Seeding documents...`);

  let inserted = 0;
  for (let i = 0; i < taskRows.rows.length; i++) {
    const task = taskRows.rows[i] as Record<string, unknown>;
    const taskId = String(task.id ?? "");

    // Assign 1-2 docs per task, cycling through DUMMY_DOCS
    const docCount = (i % 3 === 0) ? 2 : 1;
    for (let j = 0; j < docCount; j++) {
      const tmpl = DUMMY_DOCS[(i + j) % DUMMY_DOCS.length];
      const docId = randomUUID();

      await db.execute({
        sql: `INSERT INTO documents (id, entity_type, entity_id, file_name, r2_key, mime_type, file_size, uploaded_by, status, category)
              VALUES (?, 'task', ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          docId,
          taskId,
          tmpl.name,
          `seed/phase-docs/${docId}`,
          tmpl.mime,
          tmpl.size,
          userId,
          tmpl.status,
          tmpl.category,
        ],
      });
      inserted++;
    }
  }

  console.log(`✓ Inserted ${inserted} dummy documents linked to ${taskRows.rows.length} tasks.`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
