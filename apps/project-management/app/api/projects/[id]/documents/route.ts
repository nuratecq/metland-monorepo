import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { randomUUID } from "crypto";

/** Documents — docs/PRD.md:546, R2 key docs/PRD.md:1202 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM documents WHERE entity_type='project' AND entity_id=? ORDER BY uploaded_at DESC",
    args: [id],
  });
  return NextResponse.json({ data: rs.rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  // body: { file_name, r2_key, mime_type, file_size, category, uploaded_by }
  if (!body.file_name || !body.r2_key || !body.mime_type) {
    return NextResponse.json({ error: "file_name, r2_key, mime_type required" }, { status: 400 });
  }
  const allowedCat = new Set(["Contract", "Drawing", "Report", "Approval", "Photo", "Technical Document", "Other"]);
  const category = allowedCat.has(body.category) ? body.category : "Other";

  const db = getDb();
  const docId = randomUUID();
  await db.execute({
    sql: `INSERT INTO documents (id, entity_type, entity_id, file_name, r2_key, mime_type, file_size, uploaded_by, category, status)
          VALUES (?, 'project', ?, ?, ?, ?, ?, ?, ?, 'DRAFT')`,
    args: [docId, id, body.file_name, body.r2_key, body.mime_type, body.file_size ?? 0, body.uploaded_by ?? null, category],
  });

  // version row
  await db.execute({
    sql: `INSERT INTO document_versions (id, document_id, version, r2_key, file_size, uploaded_by) VALUES (?, ?, 1, ?, ?, ?)`,
    args: [randomUUID(), docId, body.r2_key, body.file_size ?? 0, body.uploaded_by ?? null],
  });

  const rs = await db.execute({ sql: "SELECT * FROM documents WHERE id = ?", args: [docId] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}
