import { redirect } from "next/navigation";
import { getPermissionsForUser } from "@metland/auth";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/turso";

/** Page-level RBAC. proxy.ts only guards /api, so a page that renders admin
 * data has to check for itself — otherwise a hidden sidebar link is the only
 * thing standing between any logged-in user and the audit trail. */
export async function requirePagePerm(perm: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  const perms = await getPermissionsForUser(getDb() as never, session.userId);
  if (!perms.includes("*") && !perms.includes(perm)) redirect("/dashboard");
  return { session, perms };
}
