import { getDb } from "@/lib/turso";
import { KpiTile, Table, Th, Td } from "@metland/ui";
import Link from "next/link";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { HEALTH_STYLE, PROJECT_STATUS_LABEL } from "@/lib/status-styles";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  project_code: string;
  name: string;
  location_text: string | null;
  progress: number;
  status: string;
  health_status: "GREEN" | "YELLOW" | "RED";
  planned_end_date: string | null;
  manager_name: string | null;
};

async function getData(q: string, status: string, sort: string) {
  try {
    const db = getDb();
    let sql = `SELECT p.id, p.project_code, p.name, p.location_text, p.progress, p.status, p.health_status, p.planned_end_date, u.name as manager_name
               FROM projects p LEFT JOIN users u ON u.id = p.manager_id WHERE 1=1`;
    const args: unknown[] = [];
    if (status) { sql += " AND p.status = ?"; args.push(status); }
    if (q) { sql += " AND (p.name LIKE ? OR p.project_code LIKE ? OR p.location_text LIKE ?)"; args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    sql += sort === "nama" ? " ORDER BY p.name ASC"
      : sort === "deadline" ? " ORDER BY p.planned_end_date ASC"
      : " ORDER BY p.progress DESC";
    sql += " LIMIT 100";
    const rs = await db.execute({ sql, args: args as never[] });
    const rows = rs.rows as unknown as Row[];

    const kpi = {
      total: await db.execute("SELECT COUNT(*) as cnt FROM projects").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)),
      onTrack: await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='GREEN'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)),
      atRisk: await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='YELLOW'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)),
      delayed: await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='RED'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)),
    };
    return { rows, kpi };
  } catch {
    return { rows: [] as Row[], kpi: { total: 0, onTrack: 0, atRisk: 0, delayed: 0 } };
  }
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const sort = sp.sort ?? "progress";
  const { rows, kpi } = await getData(q, status, sort);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Projects</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Semua proyek konstruksi yang tercatat di sistem.</p>
        </div>
        <Link href="/projects/new" className="h-9 px-4 flex items-center bg-[var(--color-primary)] text-white rounded text-sm font-semibold hover:bg-[var(--color-primary-container)]">
          + Proyek baru
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile label="Total Proyek" value={kpi.total} />
        <KpiTile label="On Track" value={kpi.onTrack} className="border-l-4 border-l-[var(--color-status-green)]" />
        <KpiTile label="At Risk" value={kpi.atRisk} className="border-l-4 border-l-[var(--color-status-yellow)]" />
        <KpiTile label="Delayed" value={kpi.delayed} className="border-l-4 border-l-[var(--color-status-red)]" />
      </div>

      <div className="bg-white border border-[var(--color-outline-variant)] rounded">
        <ProjectFilters q={q} status={status} sort={sort} />
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Proyek</Th>
              <Th>Lokasi</Th>
              <Th>Progres</Th>
              <Th>Status</Th>
              <Th>PM</Th>
              <Th>Tenggat</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><Td colSpan={7} className="text-center py-10 text-[var(--color-on-surface-variant)]">Tidak ada proyek yang cocok dengan filter ini.</Td></tr>
            ) : (
              rows.map((p) => {
                const h = HEALTH_STYLE[p.health_status] ?? HEALTH_STYLE.GREEN;
                return (
                  <tr key={p.id} className="hover:bg-[var(--color-surface-container-low)] cursor-pointer">
                    <Td>
                      <Link href={`/projects/${p.id}`} className="font-mono text-[13px] text-[var(--color-data-mono)]">{p.project_code}</Link>
                    </Td>
                    <Td>
                      <Link href={`/projects/${p.id}`} className="font-medium text-[var(--color-on-surface)]">{p.name}</Link>
                    </Td>
                    <Td className="text-[var(--color-on-surface-variant)]">{p.location_text ?? "—"}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden min-w-[64px]">
                          <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: h.color }} />
                        </div>
                        <span className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{p.progress}%</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="h-[22px] px-2 inline-flex items-center rounded text-xs font-semibold tracking-wide uppercase" style={{ background: h.bg, color: h.color }}>
                        {PROJECT_STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </Td>
                    <Td className="text-[var(--color-on-surface-variant)]">{p.manager_name ?? "—"}</Td>
                    <Td className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{p.planned_end_date ?? "—"}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
