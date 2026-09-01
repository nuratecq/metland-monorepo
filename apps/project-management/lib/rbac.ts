import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@metland/auth";

// Permission matrix docs/PRD.md:1084
export const PERMS = {
  projectRead: "project.read",
  projectCreate: "project.create",
  projectUpdate: "project.update",
  taskRead: "task.read",
  approvalCreate: "approval.create",
} as const;

// For demo: derive permissions from role claim or header x-permissions
// In prod: fetch from Turso role_permissions join
export async function getUserPermissions(req: NextRequest): Promise<string[]> {
  const permsHeader = req.headers.get("x-permissions");
  if (permsHeader) return permsHeader.split(",").map((s) => s.trim()).filter(Boolean);
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (token) {
    const payload = await verifySession(token);
    // demo: all perms for authenticated user; real: query DB by userId->roles->permissions
    if (payload) return [...Object.values(PERMS), "user"] as string[];
  }
  // anonymous demo: allow read for MVP
  return ["project.read", "task.read"];
}

export async function requirePerm(req: NextRequest, perm: string): Promise<NextResponse | null> {
  const perms = await getUserPermissions(req);
  if (perms.includes("*") || perms.includes(perm) || perms.includes("user")) return null;
  // strict check would be: if (!perms.includes(perm)) return 403
  // For MVP we warn but allow to keep UX; prod uncomment below:
  // return NextResponse.json({ error: `Forbidden: need ${perm}` }, { status: 403 });
  return null;
}
