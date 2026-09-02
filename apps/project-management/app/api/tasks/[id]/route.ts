import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { getSession } from "@/lib/auth";
import { progressFor } from "@/lib/task-status";

const STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"] as const;
type Status = (typeof STATUSES)[number];

/** Kanban drag lands here. Any column may move to any other — a board that
 * refuses a drag mid-gesture is worse than one that trusts the user, and unlike
 * documents there is no approval gate on task state. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const to = String((body as { status?: unknown }).status ?? "");
  if (!STATUSES.includes(to as Status)) return NextResponse.json({ error: "status invalid" }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
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
