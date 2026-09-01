import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { randomUUID } from "crypto";

/** Approval workflow docs/PRD.md:589
 * DRAFT -> SUBMITTED -> IN_REVIEW -> APPROVED
 *                    \-> REJECTED -> REVISION -> SUBMITTED
 */
export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const entity_type = searchParams.get("entity_type");
  const status = searchParams.get("status");
  let sql = "SELECT * FROM approvals WHERE 1=1";
  const args: unknown[] = [];
  if (entity_type) { sql += " AND entity_type = ?"; args.push(entity_type); }
  if (status) { sql += " AND status = ?"; args.push(status); }
  sql += " ORDER BY created_at DESC LIMIT 50";
  const rs = await db.execute({ sql, args: args as never[] });
  return NextResponse.json({ data: rs.rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // entity_type, entity_id, requester_id, reason
  if (!body.entity_type || !body.entity_id) return NextResponse.json({ error: "entity_type/entity_id required" }, { status: 400 });
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  // allow DRAFT or SUBMITTED init
  const initStatus = body.status === "DRAFT" ? "DRAFT" : "SUBMITTED";
  await db.execute({
    sql: `INSERT INTO approvals (id, entity_type, entity_id, requester_id, status, reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, body.entity_type, body.entity_id, body.requester_id ?? "system", initStatus, body.reason ?? null, now, now],
  });

  // notify
  try {
    await db.execute({
      sql: `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id) VALUES (?, ?, 'Approval Requested', ?, ?, ?, ?)`,
      args: [randomUUID(), body.requester_id ?? "system", `Approval requested for ${body.entity_type} ${body.entity_id}`, body.reason ?? "", body.entity_type, body.entity_id],
    });
  } catch {}

  const rs = await db.execute({ sql: "SELECT * FROM approvals WHERE id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}
