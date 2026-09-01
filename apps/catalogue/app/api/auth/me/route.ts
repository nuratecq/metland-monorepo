import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@metland/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? req.headers.get("authorization")?.replace("Bearer ","");
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });
  const payload = await verifySession(token);
  if (!payload) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user: payload, app: "catalogue", rbac: "local" });
}
