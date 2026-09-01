import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE, getPermissionsForUser } from "@metland/auth";
import { getDb } from "@/lib/turso";

// Permission matrix docs/PRD.md:1084
export const PERMS = {
  projectRead: "project.read",
  projectCreate: "project.create",
  projectUpdate: "project.update",
  taskRead: "task.read",
  approvalCreate: "approval.create",
} as const;

export async function getUserPermissions(req: NextRequest): Promise<string[]> {
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return [];
  const payload = await verifySession(token);
  if (!payload) return [];
  return getPermissionsForUser(getDb() as never, payload.userId);
}

export async function requirePerm(req: NextRequest, perm: string): Promise<NextResponse | null> {
  const perms = await getUserPermissions(req);
  if (perms.includes("*") || perms.includes(perm)) return null;
  return NextResponse.json({ error: `Forbidden: missing permission ${perm}` }, { status: 403 });
}
