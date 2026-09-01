import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { syncProjectHealth } from "@/lib/health";

/**
 * Field Update — docs/PRD.md:478,480
 * Orang lapangan: update progress + note + attachment (R2 key).
 * For MVP: PATCH progress + optional note stored as audit, health auto-recalc.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const progress = Number(body.progress);
  if (isNaN(progress) || progress < 0 || progress > 100) {
    return NextResponse.json({ error: "progress 0-100 required" }, { status: 400 });
  }
  const db = getDb();
  const now = new Date().toISOString();

  // check exists
  const exists = await db.execute({ sql: "SELECT id FROM projects WHERE id = ?", args: [id] });
  if (!exists.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.execute({ sql: "UPDATE projects SET progress = ?, updated_at = ? WHERE id = ?", args: [progress, now, id] });

  if (body.note || body.r2_key) {
    const { writeAudit } = await import("@metland/audit");
    await writeAudit(db as never, {
      action: "FIELD_UPDATE",
      entity_type: "project",
      entity_id: id,
      new_value: { progress, note: body.note ?? null, r2_key: body.r2_key ?? null, at: now },
    });
    // also store as document row if r2_key provided (photo)
    if (body.r2_key) {
      const { randomUUID } = await import("crypto");
      await db.execute({
        sql: `INSERT INTO documents (id, entity_type, entity_id, file_name, r2_key, mime_type, file_size, uploaded_by, category, status)
              VALUES (?, 'project', ?, ?, ?, ?, ?, ?, 'Photo', 'DRAFT')`,
        args: [randomUUID(), id, body.file_name ?? "field-photo.jpg", body.r2_key, body.mime_type ?? "image/jpeg", body.file_size ?? 0, body.uploaded_by ?? null],
      });
    }
  }

  const synced = await syncProjectHealth(id);
  const rs = await db.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0], health: synced.health, computed_progress: synced.progress });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const logs = await db.execute({
    sql: "SELECT * FROM audit_logs WHERE entity_type='project' AND entity_id=? AND action='FIELD_UPDATE' ORDER BY created_at DESC LIMIT 20",
    args: [id],
  });
  const project = await db.execute({ sql: "SELECT progress, health_status FROM projects WHERE id = ?", args: [id] });
  return NextResponse.json({ data: project.rows[0], field_updates: logs.rows });
}
