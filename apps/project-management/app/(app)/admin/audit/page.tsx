import { getDb } from "@/lib/turso";
import { requirePagePerm } from "@/lib/page-guard";
import { Table, Th, Td } from "@metland/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Log = {
  id: string; action: string; entity_type: string; entity_id: string;
  old_value: string | null; new_value: string | null; created_at: string; user_name: string | null;
};

const PAGE = 50;

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePagePerm("audit.read");
  const sp = await searchParams;
  const entity = sp.entity ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const db = getDb();

  let sql = `SELECT a.id, a.action, a.entity_type, a.entity_id, a.old_value, a.new_value, a.created_at, u.name AS user_name
             FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id`;
  const args: unknown[] = [];
  if (entity) { sql += " WHERE a.entity_type = ?"; args.push(entity); }
  // Fetch one extra row to learn whether a next page exists without a COUNT query.
  sql += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";
  args.push(PAGE + 1, (page - 1) * PAGE);

  const rows = await db.execute({ sql, args: args as never[] }).then((r) => r.rows as unknown as Log[]).catch(() => []);
  const hasNext = rows.length > PAGE;
  const logs = rows.slice(0, PAGE);

  const entities = await db
    .execute("SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type")
    .then((r) => (r.rows as unknown as { entity_type: string }[]).map((x) => x.entity_type))
    .catch(() => []);

  const qs = (p: Record<string, string>) => {
    const u = new URLSearchParams({ ...(entity ? { entity } : {}), ...p });
    return `/admin/audit${u.toString() ? `?${u}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Audit Trail</h1>
        <div className="flex-1" />
        <Link href="/admin/users" className="h-8 px-3 inline-flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
          Users
        </Link>
        <Link href="/admin/roles" className="h-8 px-3 inline-flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
          Roles
        </Link>
      </div>
      <p className="text-sm text-[var(--color-on-surface-variant)]">
        Semua perubahan tercatat — siapa, apa, kapan, nilai lama dan baru.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/audit" className={`h-8 px-3 inline-flex items-center rounded text-[13px] font-semibold border ${entity === "" ? "bg-[var(--color-primary)] text-white border-transparent" : "bg-white border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]"}`}>
          Semua
        </Link>
        {entities.map((e) => (
          <Link key={e} href={`/admin/audit?entity=${e}`} className={`h-8 px-3 inline-flex items-center rounded text-[13px] font-semibold border ${entity === e ? "bg-[var(--color-primary)] text-white border-transparent" : "bg-white border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]"}`}>
            {e}
          </Link>
        ))}
      </div>

      <Table>
        <thead>
          <tr><Th>Waktu</Th><Th>Pengguna</Th><Th>Aksi</Th><Th>Entitas</Th><Th>Perubahan</Th></tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><Td colSpan={5} className="text-[var(--color-on-surface-variant)]">Belum ada aktivitas tercatat</Td></tr>
          ) : (
            logs.map((l) => (
              <tr key={l.id}>
                <Td className="font-mono text-[13px] text-[var(--color-on-surface-variant)] whitespace-nowrap">{l.created_at.slice(0, 19).replace("T", " ")}</Td>
                <Td>{l.user_name ?? "—"}</Td>
                <Td className="font-medium">{l.action}</Td>
                <Td className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{l.entity_type}/{l.entity_id.slice(0, 8)}</Td>
                <Td className="font-mono text-xs text-[var(--color-on-surface-variant)] max-w-[380px] truncate" title={`${l.old_value ?? ""} → ${l.new_value ?? ""}`}>
                  {l.old_value ? `${l.old_value} → ` : ""}{l.new_value ?? "—"}
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {page > 1 || hasNext ? (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={qs({ page: String(page - 1) })} className="h-8 px-3 inline-flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              ← Sebelumnya
            </Link>
          ) : null}
          <span className="text-sm text-[var(--color-outline)]">Halaman {page}</span>
          {hasNext ? (
            <Link href={qs({ page: String(page + 1) })} className="h-8 px-3 inline-flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              Berikutnya →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
