import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const rs = await db.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [id] });
  if (!rs.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // include related counts
  const milestones = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM milestones WHERE project_id = ?", args: [id] });
  const tasks = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM tasks WHERE project_id = ?", args: [id] });
  const issues = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM issues WHERE project_id = ?", args: [id] });
  return NextResponse.json({
    data: rs.rows[0],
    counts: {
      milestones: Number((milestones.rows[0] as unknown as Record<string, number>).cnt),
      tasks: Number((tasks.rows[0] as unknown as Record<string, number>).cnt),
      issues: Number((issues.rows[0] as unknown as Record<string, number>).cnt),
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const allowed = ["name", "description", "status", "health_status", "progress", "location_text", "planned_end_date", "actual_end_date"];
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const k of allowed) {
    if (k in body) {
      sets.push(`${k} = ?`);
      args.push(body[k]);
    }
  }
  if (!sets.length) return NextResponse.json({ error: "No fields" }, { status: 400 });
  sets.push("updated_at = ?");
  args.push(new Date().toISOString());
  args.push(id);

  // fetch old for audit
  const old = await db.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [id] });
  await db.execute({ sql: `UPDATE projects SET ${sets.join(", ")} WHERE id = ?`, args: args as never[] });

  try {
    const { writeAudit } = await import("@metland/audit");
    await writeAudit(db as never, {
      action: "UPDATE",
      entity_type: "project",
      entity_id: id,
      old_value: old.rows[0],
      new_value: body,
    });
  } catch {}

  const rs = await db.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  await db.execute({ sql: "DELETE FROM projects WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
}
