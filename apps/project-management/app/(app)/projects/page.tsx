import { getDb } from "@/lib/turso";
import { KpiTile } from "@metland/ui";
import Link from "next/link";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ProjectViewToggle, type ProjectRow } from "@/components/projects/ProjectViewToggle";

export const dynamic = "force-dynamic";

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
    const rows: ProjectRow[] = (rs.rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ""),
      project_code: String(r.project_code ?? ""),
      name: String(r.name ?? ""),
      location_text: r.location_text != null ? String(r.location_text) : null,
      progress: Number(r.progress ?? 0),
      status: String(r.status ?? ""),
      health_status: String(r.health_status ?? "GREEN"),
      planned_end_date: r.planned_end_date != null ? String(r.planned_end_date) : null,
      manager_name: r.manager_name != null ? String(r.manager_name) : null,
    }));

    const kpi = {
      total: await db.execute("SELECT COUNT(*) as cnt FROM projects").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)),
      onTrack: await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='GREEN'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)),
      atRisk: await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='YELLOW'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)),
      delayed: await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='RED'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)),
    };
    return { rows, kpi };
  } catch {
    return { rows: [] as ProjectRow[], kpi: { total: 0, onTrack: 0, atRisk: 0, delayed: 0 } };
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
        <ProjectViewToggle rows={rows} />
      </div>
    </div>
  );
}
