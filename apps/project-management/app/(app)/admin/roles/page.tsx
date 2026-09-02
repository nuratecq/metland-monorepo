import { getDb } from "@/lib/turso";
import { requirePagePerm } from "@/lib/page-guard";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Role = { id: string; name: string; description: string | null; perms: string | null; user_count: number };

export default async function AdminRolesPage() {
  await requirePagePerm("user.manage");
  const db = getDb();

  // Two aggregates over different joins would multiply rows, so count users in a
  // correlated subquery and only group_concat the permissions.
  const roles = await db
    .execute(`SELECT r.id, r.name, r.description,
                     group_concat(p.name, ',') AS perms,
                     (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS user_count
              FROM roles r
              LEFT JOIN role_permissions rp ON rp.role_id = r.id
              LEFT JOIN permissions p ON p.id = rp.permission_id
              GROUP BY r.id ORDER BY r.name ASC`)
    .then((r) => r.rows as unknown as Role[])
    .catch(() => []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Roles &amp; Permissions</h1>
        <div className="flex-1" />
        <Link href="/admin/users" className="h-8 px-3 inline-flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
          Users
        </Link>
        <Link href="/admin/audit" className="h-8 px-3 inline-flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
          Audit Trail
        </Link>
      </div>
      <p className="text-sm text-[var(--color-on-surface-variant)]">
        Izin berformat <code className="font-mono">resource.action</code>, ditegakkan terpusat di <code className="font-mono">proxy.ts</code> lewat <code className="font-mono">lib/perm-rules.ts</code>.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {roles.length === 0 ? (
          <div className="text-sm text-[var(--color-on-surface-variant)]">Belum ada role — jalankan seed</div>
        ) : (
          roles.map((r) => {
            const perms = (r.perms ?? "").split(",").filter(Boolean).sort();
            return (
              <div key={r.id} className="bg-white border border-[var(--color-outline-variant)] rounded">
                <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] flex items-center gap-2">
                  <span className="font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>{r.name}</span>
                  <span className="text-xs text-[var(--color-outline)]">{Number(r.user_count)} pengguna · {perms.length} izin</span>
                </div>
                <div className="p-4 flex flex-wrap gap-1.5">
                  {perms.length === 0 ? (
                    <span className="text-sm text-[var(--color-on-surface-variant)]">Tanpa izin</span>
                  ) : (
                    perms.map((p) => (
                      <span key={p} className="font-mono text-xs px-2 py-1 rounded bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)]">
                        {p}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
