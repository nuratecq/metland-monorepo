import { getDb } from "@/lib/turso";
import { requirePagePerm } from "@/lib/page-guard";
import { Table, Th, Td } from "@metland/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Row = { id: string; email: string; name: string; status: string; created_at: string; roles: string | null };

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "#dcfce7", color: "#166534" },
  INVITED: { bg: "#fef3c7", color: "#92400e" },
  INACTIVE: { bg: "#f1f5f9", color: "#64748b" },
};

export default async function AdminUsersPage() {
  await requirePagePerm("user.manage");
  const db = getDb();

  // group_concat over the role join gives one row per user without a second query
  const users = await db
    .execute(`SELECT u.id, u.email, u.name, u.status, u.created_at, group_concat(r.name, ', ') AS roles
              FROM users u
              LEFT JOIN user_roles ur ON ur.user_id = u.id
              LEFT JOIN roles r ON r.id = ur.role_id
              GROUP BY u.id ORDER BY u.created_at ASC`)
    .then((r) => r.rows as unknown as Row[])
    .catch(() => []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Users</h1>
        <div className="flex-1" />
        <Link href="/admin/roles" className="h-8 px-3 inline-flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
          Roles
        </Link>
        <Link href="/admin/audit" className="h-8 px-3 inline-flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
          Audit Trail
        </Link>
      </div>
      <p className="text-sm text-[var(--color-on-surface-variant)]">
        Role &amp; permission model docs/PRD.md:1084. Peran diberikan lewat seed — {users.length} pengguna terdaftar.
      </p>

      <Table>
          <thead>
            <tr><Th>Nama</Th><Th>Email</Th><Th>Peran</Th><Th>Status</Th><Th>Dibuat</Th></tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><Td colSpan={5} className="text-[var(--color-on-surface-variant)]">Belum ada pengguna</Td></tr>
            ) : (
              users.map((u) => {
                const st = STATUS_STYLE[u.status] ?? STATUS_STYLE.INACTIVE;
                return (
                  <tr key={u.id}>
                    <Td className="font-medium">{u.name}</Td>
                    <Td className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{u.email}</Td>
                    <Td className="text-[var(--color-on-surface-variant)]">{u.roles ?? "—"}</Td>
                    <Td>
                      <span className="h-[22px] px-2 inline-flex items-center rounded text-xs font-semibold tracking-wide uppercase" style={{ background: st.bg, color: st.color }}>
                        {u.status}
                      </span>
                    </Td>
                    <Td className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{u.created_at.slice(0, 10)}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
      </Table>
    </div>
  );
}
