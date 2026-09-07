import { getDb } from "@/lib/turso";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

type Employee = {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: string | null;
  active_tasks: number;
  project_count: number;
};

type EmployeeProject = {
  user_id: string;
  project_id: string;
  project_code: string;
  project_name: string;
  project_status: string;
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE: { bg: "#dcfce7", color: "#166534", label: "Aktif" },
  INACTIVE: { bg: "#f1f5f9", color: "#64748b", label: "Nonaktif" },
  INVITED: { bg: "#fef3c7", color: "#92400e", label: "Diundang" },
};

const PROJECT_STATUS_DOT: Record<string, string> = {
  ACTIVE: "#22c55e",
  PLANNED: "#3b82f6",
  ON_HOLD: "#f59e0b",
  DRAFT: "#94a3b8",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function WorkloadBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color =
    pct >= 80 ? "var(--color-error)" : pct >= 50 ? "#f59e0b" : "var(--color-primary)";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-[var(--color-outline)]">Workload</span>
        <span className="font-mono text-[11px] text-[var(--color-data-mono)]">
          {value} task aktif
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default async function EmployeesPage() {
  const db = getDb();

  const [employeeRows, projectRows] = await Promise.all([
    db
      .execute(`
        SELECT
          u.id,
          u.name,
          u.email,
          u.status,
          group_concat(DISTINCT r.name) AS roles,
          COUNT(DISTINCT t.id) AS active_tasks,
          COUNT(DISTINCT pm.project_id) AS project_count
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN tasks t ON t.assignee_id = u.id
          AND t.status NOT IN ('DONE', 'CANCELLED')
        LEFT JOIN project_members pm ON pm.user_id = u.id
        WHERE u.status = 'ACTIVE'
        GROUP BY u.id
        ORDER BY u.name ASC
      `)
      .then((r) => r.rows as Record<string, unknown>[])
      .catch(() => [] as Record<string, unknown>[]),

    db
      .execute(`
        SELECT
          pm.user_id,
          p.id AS project_id,
          p.project_code,
          p.name AS project_name,
          p.status AS project_status
        FROM project_members pm
        JOIN projects p ON p.id = pm.project_id
        WHERE p.status NOT IN ('COMPLETED', 'ARCHIVED')
        ORDER BY p.name ASC
      `)
      .then((r) => r.rows as Record<string, unknown>[])
      .catch(() => [] as Record<string, unknown>[]),
  ]);

  // Serialize to plain objects
  const employees: Employee[] = employeeRows.map((r) => ({
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    status: String(r.status ?? "ACTIVE"),
    roles: r.roles != null ? String(r.roles) : null,
    active_tasks: Number(r.active_tasks ?? 0),
    project_count: Number(r.project_count ?? 0),
  }));

  const employeeProjects: EmployeeProject[] = projectRows.map((r) => ({
    user_id: String(r.user_id ?? ""),
    project_id: String(r.project_id ?? ""),
    project_code: String(r.project_code ?? ""),
    project_name: String(r.project_name ?? ""),
    project_status: String(r.project_status ?? ""),
  }));

  // Group projects by user_id
  const projectsByUser = employeeProjects.reduce<Record<string, EmployeeProject[]>>(
    (acc, p) => {
      if (!acc[p.user_id]) acc[p.user_id] = [];
      acc[p.user_id].push(p);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-hanken)" }}
        >
          Employees
        </h1>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          {employees.length} karyawan aktif — project assignment &amp; workload
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Karyawan", value: employees.length },
          {
            label: "Total Task Aktif",
            value: employees.reduce((s, e) => s + e.active_tasks, 0),
          },
          {
            label: "Rata-rata Workload",
            value:
              employees.length > 0
                ? Math.round(
                    employees.reduce((s, e) => s + e.active_tasks, 0) /
                      employees.length
                  )
                : 0,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[var(--color-outline-variant)] rounded-lg p-4"
          >
            <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">
              {s.label}
            </div>
            <div
              className="mt-1.5 text-3xl font-bold"
              style={{ fontFamily: "var(--font-hanken)" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Employee grid */}
      {employees.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-outline-variant)] bg-white text-center py-16 px-5">
          <Users size={36} className="mx-auto text-[var(--color-outline-variant)] mb-3" />
          <p className="text-[15px] font-semibold text-[var(--color-on-surface)]">
            Belum ada karyawan aktif
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-on-surface-variant)]">
            Tambahkan pengguna melalui Admin → Users.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => {
            const st = STATUS_STYLE[emp.status] ?? STATUS_STYLE.ACTIVE;
            const projects = projectsByUser[emp.id] ?? [];
            return (
              <div
                key={emp.id}
                className="bg-white border border-[var(--color-outline-variant)] rounded-lg p-4 flex flex-col gap-3"
              >
                {/* Top row: avatar + name + status */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[14px] font-semibold shrink-0"
                  >
                    {initials(emp.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[14px] text-[var(--color-on-surface)] truncate">
                      {emp.name}
                    </div>
                    <div className="text-[12px] text-[var(--color-outline)] truncate">
                      {emp.roles ?? "—"}
                    </div>
                  </div>
                  <span
                    className="h-[20px] px-2 inline-flex items-center rounded text-[11px] font-semibold tracking-wide uppercase shrink-0"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Projects */}
                <div>
                  <div className="text-[11px] font-semibold tracking-wide uppercase text-[var(--color-outline)] mb-1.5">
                    Projects ({projects.length})
                  </div>
                  {projects.length === 0 ? (
                    <span className="text-[12px] text-[var(--color-outline)]">
                      Tidak ada project aktif
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {projects.map((p) => (
                        <span
                          key={p.project_id}
                          className="inline-flex items-center gap-1 h-[22px] px-2 rounded border border-[var(--color-outline-variant)] text-[11px] font-mono text-[var(--color-on-surface-variant)]"
                          title={p.project_name}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background:
                                PROJECT_STATUS_DOT[p.project_status] ?? "#94a3b8",
                            }}
                          />
                          {p.project_code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workload */}
                <WorkloadBar value={emp.active_tasks} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
