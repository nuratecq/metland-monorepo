import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { projectSchema } from "@metland/validators";
import { randomUUID } from "crypto";

// auto-migrate on first request (dev fallback file DB)
let migrated = false;
async function ensureMigrated() {
  if (migrated) return;
  const db = getDb();
  const { pmSchemaSql } = await import("@metland/db/pm");
  for (const stmt of pmSchemaSql.split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.execute(stmt);
  }
  migrated = true;
}

function genCode() {
  // PRJ-XXX — simple incremental based on count + random
  return `PRJ-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  await ensureMigrated();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const offset = (page - 1) * limit;

  // RBAC note: Phase 1 object-level auth stub — future: filter by membership via x-user-id header / session
  const userId = req.headers.get("x-user-id");
  let sql = "SELECT * FROM projects WHERE 1=1";
  const args: unknown[] = [];
  if (status) {
    sql += " AND status = ?";
    args.push(status);
  }
  if (q) {
    sql += " AND (name LIKE ? OR project_code LIKE ?)";
    args.push(`%${q}%`, `%${q}%`);
  }
  // TODO Phase 2: if userId && role === Field Staff, filter to assigned projects
  void userId;
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  args.push(limit, offset);

  const rs = await db.execute({ sql, args: args as never[] });
  const countRs = await db.execute("SELECT COUNT(*) as cnt FROM projects");
  const total = Number((countRs.rows[0] as unknown as Record<string, number>).cnt ?? 0);

  return NextResponse.json({ data: rs.rows, total, page, limit });
}

export async function POST(req: NextRequest) {
  await ensureMigrated();
  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const id = randomUUID();
  const code = genCode();
  const now = new Date().toISOString();
  const d = parsed.data;

  await db.execute({
    sql: `INSERT INTO projects (id, project_code, name, description, location_text, start_date, planned_end_date, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, code, d.name, d.description ?? null, d.location_text ?? null, d.start_date ?? null, d.planned_end_date ?? null, d.status ?? "DRAFT", now, now],
  });

  // audit best-effort
  try {
    const { writeAudit } = await import("@metland/audit");
    await writeAudit(db as never, { action: "CREATE", entity_type: "project", entity_id: id, new_value: d });
  } catch {}

  const rs = await db.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}
