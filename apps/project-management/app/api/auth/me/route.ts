import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@metland/auth";

/** Shared identity docs/PRD.md:1045 — same JWT valid in both apps */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? req.headers.get("authorization")?.replace("Bearer ","");
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });
  const payload = await verifySession(token);
  if (!payload) return NextResponse.json({ authenticated: false }, { status: 401 });
  // Local RBAC would be fetched per-app here; shared identity + local authorization docs/PRD.md:1061
  return NextResponse.json({ authenticated: true, user: payload, app: "project-management", rbac: "local" });
}
