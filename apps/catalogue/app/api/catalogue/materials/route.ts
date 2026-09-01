import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
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
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const offset = (page - 1) * limit;

  let sql = "SELECT m.*, mc.name as category_name, s.name as supplier_name FROM materials m LEFT JOIN material_categories mc ON mc.id=m.category_id LEFT JOIN suppliers s ON s.id=m.supplier_id WHERE 1=1";
  const args: unknown[] = [];
  if (q) { sql += " AND (m.name LIKE ? OR m.brand LIKE ?)"; args.push(`%${q}%`, `%${q}%`); }
  if (category) { sql += " AND mc.name = ?"; args.push(category); }
  sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
  args.push(limit, offset);
  const rs = await db.execute({ sql, args: args as never[] });
  return NextResponse.json({ data: rs.rows, page, limit });
}

export async function POST(req: NextRequest) {
  await ensureMigrated();
  const guard = await requirePerm(req, PERMS.materialManage);
  if (guard) return guard;
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO materials (id, name, category_id, brand, unit, price, supplier_id, availability, lead_time, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
    args: [id, body.name, body.category_id ?? null, body.brand ?? null, body.unit ?? null, body.price ?? null, body.supplier_id ?? null, body.availability ?? null, body.lead_time ?? null, now, now],
  });
  const rs = await db.execute({ sql: "SELECT * FROM materials WHERE id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}
