import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";

function verifyServiceToken(req: NextRequest): boolean {
  const token = req.headers.get("x-service-token");
  if (!process.env.AUTH_SECRET) return true;
  return token === process.env.AUTH_SECRET;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") ?? "contractors";
  if (!verifyServiceToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  if (resource === "contractors") {
    const rs = await db.execute("SELECT company_name, company_code, location FROM contractors ORDER BY created_at DESC LIMIT 20");
    return NextResponse.json({ data: rs.rows, source: "catalogue" });
  }
  if (resource === "materials") {
    const rs = await db.execute("SELECT name, brand, category_id FROM materials LIMIT 20");
    return NextResponse.json({ data: rs.rows, source: "catalogue" });
  }
  return NextResponse.json({ data: [] });
}

export async function POST(req: NextRequest) {
  if (!verifyServiceToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  try {
    const db = getDb();
    const { writeAudit } = await import("@metland/audit");
    await writeAudit(db as never, { action: "ECOSYSTEM_WEBHOOK", entity_type: body.entity_type ?? "ecosystem", entity_id: body.entity_id ?? "event", new_value: body });
  } catch {}
  return NextResponse.json({ ok: true, received: body });
}
