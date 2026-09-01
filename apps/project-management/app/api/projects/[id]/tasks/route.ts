import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { taskSchema } from "@metland/validators";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const assignee = searchParams.get("assignee_id");

  let sql = "SELECT * FROM tasks WHERE project_id = ?";
  const args: unknown[] = [id];
  if (status) {
    sql += " AND status = ?";
    args.push(status);
  }
  if (assignee) {
    sql += " AND assignee_id = ?";
    args.push(assignee);
  }
  sql += " ORDER BY due_date ASC";
  const rs = await db.execute({ sql, args: args as never[] });
  return NextResponse.json({ data: rs.rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: project_id } = await params;
  const body = await req.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const tId = randomUUID();
  const now = new Date().toISOString();
  const d = parsed.data;
  await db.execute({
    sql: `INSERT INTO tasks (id, project_id, title, description, assignee_id, priority, start_date, due_date, status, progress, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [tId, project_id, d.title, d.description ?? null, d.assignee_id ?? null, d.priority, d.start_date ?? null, d.due_date ?? null, d.status, d.progress, now, now],
  });
  try { const { syncProjectHealth } = await import("@/lib/health"); await syncProjectHealth(project_id); } catch {}
  const rs = await db.execute({ sql: "SELECT * FROM tasks WHERE id = ?", args: [tId] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}
