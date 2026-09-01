import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { milestoneSchema } from "@metland/validators";
import { randomUUID } from "crypto";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const rs = await db.execute({ sql: "SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC", args: [id] });
  return NextResponse.json({ data: rs.rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: project_id } = await params;
  const body = await req.json();
  const parsed = milestoneSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const mId = randomUUID();
  const now = new Date().toISOString();
  const d = parsed.data;
  await db.execute({
    sql: `INSERT INTO milestones (id, project_id, name, description, start_date, due_date, completion_percentage, status, pic_user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [mId, project_id, d.name, d.description ?? null, d.start_date ?? null, d.due_date ?? null, d.completion_percentage, d.status, d.pic_user_id ?? null, now, now],
  });
  const rs = await db.execute({ sql: "SELECT * FROM milestones WHERE id = ?", args: [mId] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}
