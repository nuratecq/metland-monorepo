import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { contractorSchema } from "@metland/validators";
import { randomUUID } from "crypto";
import { requirePerm, PERMS } from "@/lib/rbac";

let migrated = false;
async function ensureMigrated() {
  if (migrated) return;
  const db = getDb();
  const { catalogueSchemaSql } = await import("@metland/db/catalogue");
  for (const stmt of catalogueSchemaSql.split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.execute(stmt);
  }
  migrated = true;
}

export async function GET(req: NextRequest) {
  await ensureMigrated();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const spec = searchParams.get("specialization");
  const location = searchParams.get("location");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const offset = (page - 1) * limit;

  let sql = "SELECT c.*, cc.name as category_name, cs.name as spec_name FROM contractors c LEFT JOIN contractor_categories cc ON cc.id=c.category_id LEFT JOIN contractor_specializations cs ON cs.id=c.specialization_id WHERE 1=1";
  const args: unknown[] = [];
  if (q) { sql += " AND (c.company_name LIKE ? OR c.company_code LIKE ?)"; args.push(`%${q}%`, `%${q}%`); }
  if (category) { sql += " AND cc.name = ?"; args.push(category); }
  if (spec) { sql += " AND cs.name = ?"; args.push(spec); }
  if (location) { sql += " AND c.location LIKE ?"; args.push(`%${location}%`); }
  sql += " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
  args.push(limit, offset);
  const rs = await db.execute({ sql, args: args as never[] });
  const cnt = await db.execute("SELECT COUNT(*) as cnt FROM contractors").then(r=>Number((r.rows[0] as unknown as Record<string,number>).cnt));
  return NextResponse.json({ data: rs.rows, total: cnt, page, limit });
}

export async function POST(req: NextRequest) {
  await ensureMigrated();
  const guard = await requirePerm(req, PERMS.contractorManage);
  if (guard) return guard;
  const body = await req.json();
  const parsed = contractorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const d = parsed.data;
  await db.execute({
    sql: `INSERT INTO contractors (id, company_name, company_code, description, category_id, specialization_id, location, contact_name, contact_email, contact_phone, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
    args: [id, d.company_name, d.company_code, body.description ?? null, d.category_id ?? null, d.specialization_id ?? null, d.location ?? null, body.contact_name ?? null, body.contact_email ?? null, body.contact_phone ?? null, now, now],
  });
  const rs = await db.execute({ sql: "SELECT * FROM contractors WHERE id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}
