import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { getSession } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";

/** Document lifecycle — DRAFT→UNDER_REVIEW→APPROVED|REJECTED, any→ARCHIVED. */
const NEXT: Record<string, string[]> = {
  DRAFT: ["UNDER_REVIEW", "ARCHIVED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "ARCHIVED"],
  APPROVED: ["ARCHIVED"],
  REJECTED: ["UNDER_REVIEW", "ARCHIVED"],
  ARCHIVED: [],
};
/** Verdicts need approval rights; the rest only need upload rights (checked by the proxy). */
const VERDICT: Record<string, string> = { APPROVED: "approval.approve", REJECTED: "approval.reject" };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const to = String(body.status ?? "");
  if (!(to in NEXT)) return NextResponse.json({ error: "status invalid" }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rs = await db.execute({ sql: "SELECT status FROM documents WHERE id = ?", args: [id] });
  if (!rs.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const from = String((rs.rows[0] as unknown as Record<string, string>).status);
  if (!NEXT[from].includes(to)) return NextResponse.json({ error: `Transisi ${from} → ${to} tidak diizinkan` }, { status: 409 });

  const needed = VERDICT[to];
  if (needed) {
    const perms = await getUserPermissions(req);
    if (!perms.includes("*") && !perms.includes(needed)) {
      return NextResponse.json({ error: `Forbidden: missing permission ${needed}` }, { status: 403 });
    }
  }

  await db.execute({ sql: "UPDATE documents SET status = ? WHERE id = ?", args: [to, id] });
  try {
    const { writeAudit } = await import("@metland/audit");
    await writeAudit(db as never, { user_id: session.userId, action: `DOCUMENT_${to}`, entity_type: "document", entity_id: id, old_value: { status: from }, new_value: { status: to } });
  } catch {}

  const updated = await db.execute({ sql: "SELECT * FROM documents WHERE id = ?", args: [id] });
  return NextResponse.json({ data: updated.rows[0] });
}
