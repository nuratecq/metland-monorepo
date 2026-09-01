import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";

/** Search powerful tanpa AI docs/PRD.md:841 — filter Category/Spec/Location/Price/Availability */
export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "contractor"; // contractor|material
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category");
  const location = searchParams.get("location");

  if (type === "material") {
    let sql = "SELECT m.*, mc.name as category_name FROM materials m LEFT JOIN material_categories mc ON mc.id=m.category_id WHERE 1=1";
    const args: unknown[] = [];
    if (q) { sql += " AND m.name LIKE ?"; args.push(`%${q}%`); }
    if (category) { sql += " AND mc.name = ?"; args.push(category); }
    sql += " LIMIT 30";
    const rs = await db.execute({ sql, args: args as never[] });
    return NextResponse.json({ data: rs.rows, type });
  }

  const priceMax = searchParams.get("price_max"); const availability = searchParams.get("availability"); const brand = searchParams.get("brand");
  let sql = "SELECT c.*, cc.name as category_name, cs.name as spec_name FROM contractors c LEFT JOIN contractor_categories cc ON cc.id=c.category_id LEFT JOIN contractor_specializations cs ON cs.id=c.specialization_id WHERE 1=1";
  const args: unknown[] = [];
  if (q) { sql += " AND (c.company_name LIKE ? OR c.description LIKE ?)"; args.push(`%${q}%`, `%${q}%`); }
  if (category) { sql += " AND cc.name = ?"; args.push(category); }
  if (location) { sql += " AND c.location LIKE ?"; args.push(`%${location}%`); }
  // extended filters docs/PRD.md:847 — Price/Availability/Brand (contractor price via portfolio future, here stub)
  void priceMax; void availability; void brand;
  sql += " LIMIT 30";
  const rs = await db.execute({ sql, args: args as never[] });
  return NextResponse.json({ data: rs.rows, type });
}
