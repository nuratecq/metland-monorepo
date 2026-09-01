import { NextRequest, NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@metland/auth";
import { getDb } from "@/lib/turso";

/** POST /api/auth/login — demo: auto-create user if not exists, shared JWT docs/PRD.md:1045 */
export async function POST(req: NextRequest) {
  const { email, name } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  const db = getDb();
  const existing = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] }).catch(()=>({rows:[]} as never));
  let userId: string;
  let userName = name ?? email.split("@")[0];
  if (existing.rows.length) {
    const u = existing.rows[0] as unknown as Record<string,string>;
    userId = u.id; userName = u.name;
  } else {
    const { randomUUID } = await import("crypto");
    userId = randomUUID();
    await db.execute({ sql: "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, 'demo')", args: [userId, email, userName] });
  }
  const token = await signSession({ userId, email, name: userName, roles: ["user"] });
  const res = NextResponse.json({ ok: true, user: { id: userId, email, name: userName }, token });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions() as never);
  return res;
}
