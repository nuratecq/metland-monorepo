import { NextRequest, NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/auth/forgot — demo: always accept, no email actually sent */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
