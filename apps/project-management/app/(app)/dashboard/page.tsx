import { KpiTile } from "@metland/ui";
import { Card, CardContent, CardHeader } from "@metland/ui";
import { Badge } from "@metland/ui";
import { HealthMeter } from "@metland/ui";
import Link from "next/link";
import { getDb } from "@/lib/turso";
import {
  TaskPriorityDonut,
  ProjectStatusBar,
  TaskActivityLine,
  type PriorityItem,
  type ProjectStatusItem,
  type DailyActivity,
} from "./charts";

export const dynamic = "force-dynamic";

// Mirrors the board columns in components/tasks/Kanban.tsx; CANCELLED is not
// work in flight so it stays off both.
const BOARD = [
  { status: "TODO", label: "To Do", bar: "bg-[var(--color-outline)]" },
  { status: "IN_PROGRESS", label: "In Progress", bar: "bg-[var(--color-primary)]" },
  { status: "BLOCKED", label: "Blocked", bar: "bg-red-500" },
  { status: "DONE", label: "Done", bar: "bg-emerald-500" },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#3b82f6", LOW: "#94a3b8",
};

async function getKpi() {
  try {
    const db = getDb();

    // 8 sequential queries → 5 parallel, project KPIs batched into 1 SQL
    const [projectKpi, overdueTasks, upcoming, byStatusRs, priorityRs, projectStatusRs, activityRs] =
      await Promise.all([
        db.execute(`
          SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN status='ACTIVE' THEN 1 END) as active,
            COUNT(CASE WHEN health_status='RED' THEN 1 END) as delayed,
            COUNT(CASE WHEN health_status='YELLOW' THEN 1 END) as at_risk
          FROM projects
        `).then(r => r.rows[0] as unknown as Record<string, number>),
        db.execute("SELECT COUNT(*) as cnt FROM tasks WHERE due_date < date('now') AND status != 'DONE'")
          .then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0),
        db.execute("SELECT COUNT(*) as cnt FROM milestones WHERE due_date BETWEEN date('now') AND date('now','+14 days')")
          .then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0),
        db.execute("SELECT status, COUNT(*) as cnt FROM tasks GROUP BY status")
          .then(r => r.rows as unknown as { status: string; cnt: number }[]).catch(() => []),
        db.execute("SELECT priority, COUNT(*) as cnt FROM tasks GROUP BY priority")
          .then(r => r.rows as unknown as { priority: string; cnt: number }[]).catch(() => []),
        db.execute("SELECT status, COUNT(*) as cnt FROM projects GROUP BY status ORDER BY cnt DESC")
          .then(r => r.rows as unknown as { status: string; cnt: number }[]).catch(() => []),
        db.execute("SELECT date(created_at) as day, COUNT(*) as cnt FROM tasks WHERE date(created_at) >= date('now','-30 days') GROUP BY date(created_at) ORDER BY day ASC")
          .then(r => r.rows as unknown as { day: string; cnt: number }[]).catch(() => []),
      ]);

    const total = Number(projectKpi.total ?? 0);
    const active = Number(projectKpi.active ?? 0);
    const delayed = Number(projectKpi.delayed ?? 0);
    const atRisk = Number(projectKpi.at_risk ?? 0);

    const byStatus = Object.fromEntries(byStatusRs.map(x => [x.status, Number(x.cnt)]));
    const board = BOARD.map(b => ({ ...b, count: byStatus[b.status] ?? 0 }));

    const priorityData: PriorityItem[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => ({
      name: p.charAt(0) + p.slice(1).toLowerCase(),
      value: Number(priorityRs.find(r => r.priority === p)?.cnt ?? 0),
      fill: PRIORITY_COLORS[p],
    }));

    const projectStatusData: ProjectStatusItem[] = projectStatusRs.map(r => ({
      status: String(r.status),
      count: Number(r.cnt),
    }));

    const activityData: DailyActivity[] = activityRs.map(r => ({
      day: String(r.day),
      tasks: Number(r.cnt),
    }));

    return {
      total, active, delayed, atRisk, overdueTasks, upcoming, board,
      taskTotal: board.reduce((s, b) => s + b.count, 0),
      priorityData, projectStatusData, activityData,
    };
  } catch {
    return {
      total: 0, active: 0, delayed: 0, atRisk: 0, overdueTasks: 0, upcoming: 0,
      board: BOARD.map(b => ({ ...b, count: 0 })), taskTotal: 0,
      priorityData: [] as PriorityItem[],
      projectStatusData: [] as ProjectStatusItem[],
      activityData: [] as DailyActivity[],
    };
  }
}

export default async function Dashboard() {
  const kpi = await getKpi();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Dashboard</h1>
        <p className="text-sm text-[var(--color-on-surface-variant)]">Operational overview — Plan → Execute → Monitor → Report</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/projects" className="block">
          <KpiTile label="Total Projects" value={kpi.total} sub={`${kpi.active} active`} className="cursor-pointer hover:bg-[var(--color-surface-container-low)] transition-colors" />
        </Link>
        <Link href="/projects/my" className="block">
          <KpiTile label="Delayed" value={kpi.delayed} sub="health RED" className="cursor-pointer hover:bg-[var(--color-surface-container-low)] transition-colors" />
        </Link>
        <KpiTile label="At Risk" value={kpi.atRisk} sub="health YELLOW" />
        <KpiTile label="Overdue Tasks" value={kpi.overdueTasks} />
        <KpiTile label="Upcoming Milestones (14d)" value={kpi.upcoming} />
        <KpiTile label="Active Projects" value={kpi.active} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="font-semibold">Project Health</CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span>On Track</span><Badge status="success">GREEN</Badge></div>
            <HealthMeter value={kpi.total ? Math.round((kpi.total - kpi.delayed - kpi.atRisk) / Math.max(1, kpi.total) * 100) : 0} health="GREEN" />
            <div className="flex items-center justify-between text-sm"><span>At Risk</span><Badge status="warning">YELLOW</Badge></div>
            <HealthMeter value={kpi.total ? Math.round(kpi.atRisk / kpi.total * 100) : 0} health="YELLOW" />
            <div className="flex items-center justify-between text-sm"><span>Delayed</span><Badge status="critical">RED</Badge></div>
            <HealthMeter value={kpi.total ? Math.round(kpi.delayed / kpi.total * 100) : 0} health="RED" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="font-semibold flex items-center justify-between">
            <span>Task Board</span>
            <Link href="/tasks" className="text-xs font-normal text-[var(--color-primary)] hover:underline">Buka board →</Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {kpi.board.length === 0 ? (
              <p className="text-sm text-[var(--color-on-surface-variant)]">Belum ada task.</p>
            ) : kpi.board.map((c) => (
              <div key={c.status}>
                <div className="flex items-center justify-between text-sm">
                  <span>{c.label}</span>
                  <span className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{c.count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[var(--color-surface-container)]">
                  <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${kpi.taskTotal ? Math.round((c.count / kpi.taskTotal) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <TaskPriorityDonut data={kpi.priorityData} />
        <ProjectStatusBar data={kpi.projectStatusData} />
        <TaskActivityLine data={kpi.activityData} />
      </div>
    </div>
  );
}
