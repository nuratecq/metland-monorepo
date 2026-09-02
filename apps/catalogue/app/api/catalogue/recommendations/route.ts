import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { randomUUID } from "crypto";
import { requirePerm, PERMS } from "@/lib/rbac";

/** GET recommendations list, POST approval request */
export async function GET(_req: NextRequest) {
  const db = getDb();
  const rs = await db.execute("SELECT * FROM recommendations ORDER BY created_at DESC LIMIT 20");
  return NextResponse.json({ data: rs.rows });
}

export async function POST(req: NextRequest) {
  const guard = await requirePerm(req, PERMS.approvalCreate);
  if (guard) return guard;
  const body = await req.json(); // { recommendation_id, selected_contractor_id, reason, requester_id }
  if (!body.recommendation_id || !body.selected_contractor_id) return NextResponse.json({ error: "recommendation_id & selected_contractor_id required" }, { status: 400 });
  const db = getDb();
  const id = randomUUID();
  await db.execute({
    sql: `INSERT INTO approval_requests (id, recommendation_id, requester_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'SUBMITTED', ?, ?)`,
    args: [id, body.recommendation_id, body.requester_id ?? "procurement_1", body.reason ?? null, new Date().toISOString(), new Date().toISOString()],
  });
  // also insert mapping table? for now store selected in reason JSON
  const rs = await db.execute({ sql: "SELECT * FROM approval_requests WHERE id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}
