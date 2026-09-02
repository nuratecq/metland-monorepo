import { redirect } from "next/navigation";
import { getPermissionsForUser } from "@metland/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/turso";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  // Role label and admin links both come from the DB — the label was hardcoded
  // "Project Manager" before, which is wrong for every other account.
  const [perms, roleName] = await Promise.all([
    getPermissionsForUser(db as never, session.userId).catch(() => [] as string[]),
    db
      .execute({
        sql: "SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? ORDER BY r.name LIMIT 1",
        args: [session.userId],
      })
      .then((r) => (r.rows[0] as unknown as { name: string } | undefined)?.name ?? "Pengguna")
      .catch(() => "Pengguna"),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ name: session.name, role: roleName }} perms={perms} />
      <div className="flex flex-1 flex-col">
        <Topbar user={{ name: session.name }} />
        <main className="flex-1 p-6 bg-[var(--color-surface)]">{children}</main>
      </div>
    </div>
  );
}
