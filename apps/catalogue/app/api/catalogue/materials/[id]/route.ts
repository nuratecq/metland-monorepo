import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const rs = await db.execute({ sql: "SELECT m.*, mc.name as category_name FROM materials m LEFT JOIN material_categories mc ON mc.id=m.category_id WHERE m.id = ?", args: [id] });
  if (!rs.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const specs = await db.execute({ sql: "SELECT * FROM material_specifications WHERE material_id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0], specifications: specs.rows });
}
