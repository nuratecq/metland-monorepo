import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { getSession } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const rs = await db.execute({ sql: "SELECT * FROM issues WHERE project_id = ? ORDER BY created_at DESC", args: [id] });
  return NextResponse.json({ data: rs.rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: project_id } = await params;
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  // Reporter comes from the session — a client-supplied reported_by would let
  // anyone file an issue under someone else's name.
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const iId = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO issues (id, project_id, title, description, severity, status, reported_by, assigned_to, due_date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [iId, project_id, body.title, body.description ?? null, body.severity ?? "MEDIUM", body.status ?? "OPEN", session.userId, body.assigned_to ?? null, body.due_date ?? null, now, now],
  });
  const rs = await db.execute({ sql: "SELECT * FROM issues WHERE id = ?", args: [iId] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}
