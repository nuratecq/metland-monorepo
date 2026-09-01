import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { requirePerm, PERMS } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const rs = await db.execute({ sql: "SELECT c.*, cc.name as category_name, cs.name as spec_name FROM contractors c LEFT JOIN contractor_categories cc ON cc.id=c.category_id LEFT JOIN contractor_specializations cs ON cs.id=c.specialization_id WHERE c.id = ?", args: [id] });
  if (!rs.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const portfolios = await db.execute({ sql: "SELECT * FROM contractor_portfolios WHERE contractor_id = ? ORDER BY year DESC", args: [id] });
  const certs = await db.execute({ sql: "SELECT * FROM contractor_certifications WHERE contractor_id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0], portfolios: portfolios.rows, certifications: certs.rows });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePerm(req, PERMS.contractorManage);
  if (guard) return guard;
  const { id } = await params;
  const body = await req.json();
  const allowed = ["company_name","description","location","contact_name","contact_email","contact_phone","status"];
  const sets: string[] = []; const args: unknown[] = [];
  for (const k of allowed) if (k in body) { sets.push(`${k} = ?`); args.push(body[k]); }
  if (!sets.length) return NextResponse.json({ error: "No fields" }, { status: 400 });
  sets.push("updated_at = ?"); args.push(new Date().toISOString()); args.push(id);
  const db = getDb();
  await db.execute({ sql: `UPDATE contractors SET ${sets.join(", ")} WHERE id = ?`, args: args as never[] });
  const rs = await db.execute({ sql: "SELECT * FROM contractors WHERE id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0] });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePerm(req, PERMS.contractorManage);
  if (guard) return guard;
  const { id } = await params;
  const db = getDb();
  await db.execute({ sql: "DELETE FROM contractors WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
}
