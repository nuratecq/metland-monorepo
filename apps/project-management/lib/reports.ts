import { getDb } from "@/lib/turso";
import type { Sheet } from "@/lib/export";

/** Report queries — shared by the page (direct call) and the export route. */

export type Row = Record<string, string | number | null>;
export type Period = { from: string | null; to: string | null };

const n = (r: { rows: unknown[] }) => Number((r.rows[0] as Row)?.cnt ?? 0);

/** ISO date (YYYY-MM-DD) only — anything else becomes null rather than reaching SQL. */
export const asDate = (s: string | null | undefined): string | null =>
  s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;

export function conclude(progress: number, health: string, overdue: number, openIssues: number): string {
  if (health === "RED") return `Delayed — perlu tindakan segera. ${overdue} task overdue, ${openIssues} issue terbuka.`;
  if (health === "YELLOW") return `At risk — progress ${progress}%, ${overdue} task overdue. Pantau ketat.`;
  if (progress >= 100) return "Selesai — seluruh scope tercapai.";
  return `On track — progress ${progress}%${overdue ? `, namun ${overdue} task overdue` : ""}.`;
}

export type ProjectSummary = {
  kind: "project";
  period: Period;
  project: Row;
  milestones: Row[];
  task_status: Row[];
  issue_status: Row[];
  overdue_tasks: number;
  conclusion: string;
};

export type DashboardReport = {
  kind: "dashboard";
  period: Period;
  total: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
  completed: number;
  completionRate: number;
  byStatus: Row[];
  byHealth: Row[];
  overdueTasks: number;
};

export async function projectSummary(projectId: string, period: Period): Promise<ProjectSummary | null> {
  const db = getDb();
  const clause = `${period.from ? " AND date(created_at) >= date(?)" : ""}${period.to ? " AND date(created_at) <= date(?)" : ""}`;
  const args = [period.from, period.to].filter((v): v is string => v !== null);

  const p = await db.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [projectId] });
  const project = p.rows[0] as Row | undefined;
  if (!project) return null;

  const ms = await db.execute({
    sql: `SELECT name, status, completion_percentage, start_date, due_date FROM milestones WHERE project_id = ?${clause} ORDER BY due_date`,
    args: [projectId, ...args],
  });
  const ts = await db.execute({
    sql: `SELECT status, COUNT(*) as cnt FROM tasks WHERE project_id = ?${clause} GROUP BY status`,
    args: [projectId, ...args],
  });
  const iss = await db.execute({
    sql: `SELECT severity, status, COUNT(*) as cnt FROM issues WHERE project_id = ?${clause} GROUP BY severity, status`,
    args: [projectId, ...args],
  });
  const overdue = n(await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM tasks WHERE project_id = ? AND due_date < date('now') AND status NOT IN ('DONE','CANCELLED')",
    args: [projectId],
  }));
  const openIssues = (iss.rows as Row[])
    .filter((r) => r.status === "OPEN" || r.status === "IN_PROGRESS")
    .reduce((a, r) => a + Number(r.cnt), 0);

  const progress = Number(project.progress ?? 0);
  return {
    kind: "project",
    period,
    project,
    milestones: ms.rows as Row[],
    task_status: ts.rows as Row[],
    issue_status: iss.rows as Row[],
    overdue_tasks: overdue,
    conclusion: conclude(progress, String(project.health_status), overdue, openIssues),
  };
}

export async function dashboardReport(period: Period): Promise<DashboardReport> {
  const db = getDb();
  const clause = `${period.from ? " AND date(created_at) >= date(?)" : ""}${period.to ? " AND date(created_at) <= date(?)" : ""}`;
  const args = [period.from, period.to].filter((v): v is string => v !== null);
  const where = clause ? `WHERE 1=1${clause}` : "";

  const total = n(await db.execute({ sql: `SELECT COUNT(*) as cnt FROM projects ${where}`, args }));
  const completed = n(await db.execute({ sql: `SELECT COUNT(*) as cnt FROM projects WHERE status='COMPLETED'${clause}`, args }));
  const byStatus = await db.execute({ sql: `SELECT status, COUNT(*) as cnt FROM projects ${where} GROUP BY status`, args });
  const byHealth = await db.execute({ sql: `SELECT health_status, COUNT(*) as cnt FROM projects ${where} GROUP BY health_status`, args });
  const overdueTasks = n(await db.execute("SELECT COUNT(*) as cnt FROM tasks WHERE due_date < date('now') AND status NOT IN ('DONE','CANCELLED')"));
  const health = Object.fromEntries((byHealth.rows as Row[]).map((r) => [r.health_status, Number(r.cnt)]));

  return {
    kind: "dashboard",
    period,
    total,
    onTrack: health.GREEN ?? 0,
    atRisk: health.YELLOW ?? 0,
    delayed: health.RED ?? 0,
    completed,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    byStatus: byStatus.rows as Row[],
    byHealth: byHealth.rows as Row[],
    overdueTasks,
  };
}

const label = (p: Period) => `${p.from ?? "awal"} s/d ${p.to ?? "sekarang"}`;

export function projectSheets(r: ProjectSummary): Sheet[] {
  return [
    {
      name: "Summary",
      rows: [
        ["Field", "Value"],
        ["Project", String(r.project.name)],
        ["Code", String(r.project.project_code)],
        ["Reporting Period", label(r.period)],
        ["Status", String(r.project.status)],
        ["Health", String(r.project.health_status)],
        ["Progress (%)", Number(r.project.progress ?? 0)],
        ["Overdue Tasks", r.overdue_tasks],
        ["Conclusion", r.conclusion],
      ],
    },
    {
      name: "Milestones",
      rows: [["Name", "Status", "Completion (%)", "Start", "Due"],
        ...r.milestones.map((m) => [m.name, m.status, m.completion_percentage, m.start_date, m.due_date])],
    },
    { name: "Task Status", rows: [["Status", "Count"], ...r.task_status.map((t) => [t.status, t.cnt])] },
    { name: "Issues", rows: [["Severity", "Status", "Count"], ...r.issue_status.map((i) => [i.severity, i.status, i.cnt])] },
  ];
}

export function dashboardSheets(r: DashboardReport): Sheet[] {
  return [
    {
      name: "Dashboard",
      rows: [
        ["Metric", "Value"],
        ["Reporting Period", label(r.period)],
        ["Total Project", r.total],
        ["On Track", r.onTrack],
        ["At Risk", r.atRisk],
        ["Delayed", r.delayed],
        ["Completed", r.completed],
        ["Completion (%)", r.completionRate],
        ["Overdue Tasks", r.overdueTasks],
      ],
    },
    { name: "By Status", rows: [["Status", "Count"], ...r.byStatus.map((s) => [s.status, s.cnt])] },
  ];
}
