import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { getSession } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const ap = await db.execute({ sql: "SELECT * FROM approvals WHERE id = ?", args: [id] });
  if (!ap.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const actions = await db.execute({ sql: "SELECT * FROM approval_actions WHERE approval_id = ? ORDER BY created_at ASC", args: [id] });
  return NextResponse.json({ data: ap.rows[0], actions: actions.rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json(); // { approver_id, decision: APPROVED|REJECTED|COMMENTED, comment }
  const decision = body.decision as string;
  if (!["APPROVED", "REJECTED", "COMMENTED"].includes(decision)) return NextResponse.json({ error: "decision APPROVED|REJECTED|COMMENTED required" }, { status: 400 });
  // Approver identity comes from the session, never from the request body — a
  // client-supplied approver_id would let anyone sign off as someone else.
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const approverId = session.userId;

  const db = getDb();
  const ap = await db.execute({ sql: "SELECT * FROM approvals WHERE id = ?", args: [id] });
  if (!ap.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO approval_actions (id, approval_id, approver_id, decision, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [randomUUID(), id, approverId, decision, body.comment ?? null, now],
  });

  // full workflow: DRAFT->SUBMITTED->IN_REVIEW->APPROVED, REJECTED->REVISION->SUBMITTED
  let newStatus: string | null = null;
  if (decision === "APPROVED") newStatus = "APPROVED";
  else if (decision === "REJECTED") newStatus = "REJECTED";
  else if (decision === "COMMENTED") {
    const cur = String((ap.rows[0] as unknown as Record<string,string>).status);
    if (cur === "SUBMITTED") newStatus = "IN_REVIEW";
  }
  // support explicit REVISION signal via comment "REVISION"
  if (body.status === "REVISION" || String(body.comment ?? "").includes("REVISION")) newStatus = "REVISION";
  if (body.status === "SUBMITTED" && String((ap.rows[0] as unknown as Record<string,string>).status) === "REVISION") newStatus = "SUBMITTED";

  if (newStatus) {
    await db.execute({ sql: "UPDATE approvals SET status = ?, updated_at = ? WHERE id = ?", args: [newStatus, now, id] });
    // audit + notification
    try {
      const { writeAudit } = await import("@metland/audit");
      await writeAudit(db as never, { user_id: approverId, action: `APPROVAL_${decision}`, entity_type: "approval", entity_id: id, new_value: body });
      await db.execute({
        sql: `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, 'approval', ?)`,
        args: [randomUUID(), String((ap.rows[0] as unknown as Record<string, string>).requester_id), `Approval ${decision}`, body.comment ?? "", String((ap.rows[0] as unknown as Record<string, string>).entity_type), id],
      });
    } catch {}
  }

  const updated = await db.execute({ sql: "SELECT * FROM approvals WHERE id = ?", args: [id] });
  return NextResponse.json({ data: updated.rows[0] });
}
