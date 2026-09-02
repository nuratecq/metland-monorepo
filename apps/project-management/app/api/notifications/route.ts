import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { randomUUID } from "crypto";

/** In-app notification MVP */
export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id") ?? "system";
  const unread = searchParams.get("unread");
  let sql = "SELECT * FROM notifications WHERE user_id = ?";
  const args: unknown[] = [user_id];
  if (unread === "true") sql += " AND is_read = 0";
  sql += " ORDER BY created_at DESC LIMIT 50";
  const rs = await db.execute({ sql, args: args as never[] });
  return NextResponse.json({ data: rs.rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // type, title, body, user_id, entity_type, entity_id
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const db = getDb();
  const id = randomUUID();
  await db.execute({
    sql: `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, body.user_id ?? "system", body.type ?? "General", body.title, body.body ?? null, body.entity_type ?? null, body.entity_id ?? null],
  });
  const rs = await db.execute({ sql: "SELECT * FROM notifications WHERE id = ?", args: [id] });
  return NextResponse.json({ data: rs.rows[0] }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json(); // { ids: string[], is_read: 0|1 }
  const db = getDb();
  if (body.ids?.length) {
    for (const id of body.ids) {
      await db.execute({ sql: "UPDATE notifications SET is_read = ? WHERE id = ?", args: [body.is_read ? 1 : 0, id] });
    }
  } else if (body.mark_all_read) {
    const uid = body.user_id ?? "system";
    await db.execute({ sql: "UPDATE notifications SET is_read = 1 WHERE user_id = ?", args: [uid] });
  }
  return NextResponse.json({ ok: true });
}
