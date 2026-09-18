import { getDb } from "@/lib/turso";
import { ProjectViewToggle, type ProjectRow } from "@/components/projects/ProjectViewToggle";
import Link from "next/link";
import { LayoutList, LayoutGrid } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const view = sp.view === "grid" ? "grid" : "list";
  const db = getDb();
  let rows: ProjectRow[] = [];
  try {
    const rs = await db.execute(
      `SELECT p.id, p.project_code, p.name, p.location_text, p.progress, p.status,
              p.health_status, p.planned_end_date, u.name as manager_name
       FROM projects p
       LEFT JOIN users u ON u.id = p.manager_id
       WHERE p.status IN ('ACTIVE','PLANNED')
       ORDER BY p.updated_at DESC
       LIMIT 20`
    );
    rows = (rs.rows as unknown as Record<string, unknown>[]).map((r) => ({
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
  } catch {}

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>My Projects</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            {rows.length} proyek aktif atau direncanakan.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded border border-[var(--color-outline-variant)] p-0.5">
          <Link
            href="/projects/my"
            title="List view"
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              view !== "grid"
                ? "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]"
                : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
            }`}
          >
            <LayoutList size={14} />
          </Link>
          <Link
            href="/projects/my?view=grid"
            title="Grid view"
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              view === "grid"
                ? "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]"
                : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
            }`}
          >
            <LayoutGrid size={14} />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <ProjectViewToggle rows={rows} view={view} />
      </div>
    </div>
  );
}
