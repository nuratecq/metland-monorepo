import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE, getPermissionsForUser } from "@metland/auth";
import { getDb } from "@/lib/turso";

export const PERMS = {
  contractorManage: "catalogue.contractor.manage",
  materialManage: "catalogue.material.manage",
  importCreate: "import.create",
  approvalCreate: "approval.create",
  approvalApprove: "approval.approve",
  approvalReject: "approval.reject",
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
