import { NextRequest, NextResponse } from "next/server";
import { authenticate, signSession, SESSION_COOKIE, sessionCookieOptions } from "@metland/auth";
import { getDb } from "@/lib/turso";

/**
 * POST /api/auth/login — verifies the password against users.password_hash.
 * Accounts are never auto-created here; an admin or the seed script must
 * provision them, so an unknown email cannot mint itself a session.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await authenticate(getDb(), body.email, body.password);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const token = await signSession({
    userId: result.userId,
    email: result.email,
    name: result.name,
    roles: ["user"],
  });
  // Token travels in the httpOnly cookie only — never in the JSON body, where
  // any script on the page could read it.
  const res = NextResponse.json({ ok: true, user: { id: result.userId, email: result.email, name: result.name } });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions() as never);
  return res;
}
