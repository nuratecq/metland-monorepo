import { getDb } from "@/lib/turso";
import { MiniCalendar } from "./MiniCalendar";
import { CalendarDays, Clock, CheckCircle2, Circle, Ban, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

type Milestone = {
  id: string;
  name: string;
  project_name: string;
  project_code: string;
  due_date: string | null;
  start_date: string | null;
  status: string;
  completion_percentage: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Circle }> = {
  TODO:        { label: "To Do",      color: "#64748b", bg: "#f1f5f9", icon: Circle },
  IN_PROGRESS: { label: "In Progress",color: "#006767", bg: "#e6f2f2", icon: Loader2 },
  DONE:        { label: "Done",       color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  BLOCKED:     { label: "Blocked",    color: "#dc2626", bg: "#fef2f2", icon: Ban },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(due: string | null, status: string) {
  if (!due || status === "DONE") return false;
  return new Date(due) < new Date();
}

export default async function SchedulePage() {
  const db = getDb();
  let milestones: Milestone[] = [];

  try {
    const rs = await db.execute(`
      SELECT m.id, m.name, m.due_date, m.start_date, m.status, m.completion_percentage,
             p.name as project_name, p.project_code
      FROM milestones m
      JOIN projects p ON p.id = m.project_id
      ORDER BY m.due_date ASC NULLS LAST
      LIMIT 100
    `);
    milestones = (rs.rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ""),
      name: String(r.name ?? ""),
      project_name: String(r.project_name ?? ""),
      project_code: String(r.project_code ?? ""),
      due_date: r.due_date != null ? String(r.due_date) : null,
      start_date: r.start_date != null ? String(r.start_date) : null,
      status: String(r.status ?? "TODO"),
      completion_percentage: Number(r.completion_percentage ?? 0),
    }));
  } catch {}

  const milestoneDates = milestones
    .filter((m) => m.due_date)
    .map((m) => m.due_date as string);

  return (
    <div className="flex gap-5 h-full">
      {/* Left: mini calendar */}
      <div className="w-[192px] shrink-0 space-y-4">
        <MiniCalendar milestoneDates={milestoneDates} />

        {/* Quick stats */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-2.5">
          <div className="text-[12px] font-semibold text-[var(--color-on-surface-variant)] mb-3">Summary</div>
          {(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = milestones.filter((m) => m.status === s).length;
            return (
              <div key={s} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <cfg.icon size={12} style={{ color: cfg.color }} />
                  <span className="text-[12px] text-[var(--color-on-surface-variant)]">{cfg.label}</span>
                </div>
                <span className="text-[12px] font-semibold" style={{ color: cfg.color }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: milestone list */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Schedule</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">{milestones.length} milestone terdaftar</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--color-on-surface-variant)]">
              <CalendarDays size={36} className="opacity-30 mb-3" />
              <p className="text-sm">Belum ada milestone.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[140px]">
                    <div className="flex items-center gap-1.5"><CalendarDays size={11} /> Date</div>
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[220px]">Milestone</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[180px]">Project</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[120px]">
                    <div className="flex items-center gap-1.5"><Clock size={11} /> Status</div>
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[100px]">Progress</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => {
                  const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.TODO;
                  const overdue = isOverdue(m.due_date, m.status);
                  return (
                    <tr key={m.id} className="border-b border-[var(--color-outline-variant)] last:border-0 hover:bg-[var(--color-surface-container-low)] transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-[12px] font-mono ${overdue ? "text-[#dc2626]" : "text-[var(--color-on-surface-variant)]"}`}>
                          {formatDate(m.due_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <span className="font-medium text-[var(--color-on-surface)] truncate block">{m.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-[var(--color-outline)]">{m.project_code}</span>
                          <span className="text-[var(--color-on-surface-variant)] truncate max-w-[110px]">{m.project_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 h-[22px] px-2 rounded text-[11px] font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          <cfg.icon size={10} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-container-high)]">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${m.completion_percentage}%`, background: cfg.color }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-[var(--color-on-surface-variant)] w-7 shrink-0">
                            {m.completion_percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
