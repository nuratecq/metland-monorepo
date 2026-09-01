import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";

/** Cross-app API docs/PRD.md:1252 — service-to-service via shared secret header */
function verifyServiceToken(req: NextRequest): boolean {
  const token = req.headers.get("x-service-token");
  // MVP: check equals AUTH_SECRET or bypass if not set
  if (!process.env.AUTH_SECRET) return true;
  return token === process.env.AUTH_SECRET;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") ?? "projects";
  if (!verifyServiceToken(req)) return NextResponse.json({ error: "Unauthorized service" }, { status: 401 });

  const db = getDb();
  if (resource === "locations") {
    const rs = await db.execute("SELECT DISTINCT location_text as name FROM projects WHERE location_text IS NOT NULL LIMIT 20");
    return NextResponse.json({ data: rs.rows });
  }
  if (resource === "project_types") {
    const rs = await db.execute("SELECT * FROM master_project_types LIMIT 20");
    return NextResponse.json({ data: rs.rows });
  }
  // default: projects summary for catalogue context
  const rs = await db.execute("SELECT project_code, name, location_text, status FROM projects ORDER BY created_at DESC LIMIT 20");
  return NextResponse.json({ data: rs.rows, source: "project-management", via: "ecosystem" });
}

export async function POST(req: NextRequest) {
  // Webhook/event ingress docs/PRD.md:1252
  if (!verifyServiceToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  // log to audit
  try {
    const db = getDb();
    const { writeAudit } = await import("@metland/audit");
    await writeAudit(db as never, { action: "ECOSYSTEM_WEBHOOK", entity_type: body.entity_type ?? "ecosystem", entity_id: body.entity_id ?? "event", new_value: body });
  } catch {}
  return NextResponse.json({ ok: true, received: body });
}
