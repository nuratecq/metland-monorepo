import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { getSession } from "@/lib/auth";
import { progressFor } from "@/lib/task-status";

const STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
type Status = (typeof STATUSES)[number];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { status?: unknown; priority?: unknown };

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Priority update path
  if (body.priority !== undefined && body.status === undefined) {
    const priority = String(body.priority);
    if (!PRIORITIES.includes(priority as never)) {
      return NextResponse.json({ error: "priority invalid" }, { status: 400 });
    }
    const rs = await db.execute({ sql: "SELECT project_id FROM tasks WHERE id = ?", args: [id] });
    if (!rs.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.execute({
      sql: "UPDATE tasks SET priority = ?, updated_at = ? WHERE id = ?",
      args: [priority, new Date().toISOString(), id],
    });
    return NextResponse.json({ data: { id, priority } });
  }

  // Status update path (original behavior)
  const to = String(body.status ?? "");
  if (!STATUSES.includes(to as Status)) return NextResponse.json({ error: "status invalid" }, { status: 400 });

  const rs = await db.execute({ sql: "SELECT project_id, status FROM tasks WHERE id = ?", args: [id] });
  if (!rs.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = rs.rows[0] as unknown as { project_id: string; status: string };
  if (row.status === to) return NextResponse.json({ data: { id, status: to } });

  const progress = progressFor(row.status, to);
  await db.execute({
    sql: `UPDATE tasks SET status = ?, updated_at = ?${progress === null ? "" : ", progress = ?"} WHERE id = ?`,
    args: progress === null ? [to, new Date().toISOString(), id] : [to, new Date().toISOString(), progress, id],
  });

  try {
    const { writeAudit } = await import("@metland/audit");
    await writeAudit(db as never, { user_id: session.userId, action: `TASK_${to}`, entity_type: "task", entity_id: id, old_value: { status: row.status }, new_value: { status: to } });
  } catch {}
  try { const { syncProjectHealth } = await import("@/lib/health"); await syncProjectHealth(row.project_id); } catch {}

  return NextResponse.json({ data: { id, status: to } });
}
