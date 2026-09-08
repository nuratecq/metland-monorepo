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

async function getKpi() {
  try {
    const db = getDb();
    const total = await db.execute("SELECT COUNT(*) as cnt FROM projects").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt));
    const active = await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE status='ACTIVE'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt));
    const delayed = await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='RED'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt));
    const atRisk = await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='YELLOW'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt));
    const overdueTasks = await db.execute("SELECT COUNT(*) as cnt FROM tasks WHERE due_date < date('now') AND status != 'DONE'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0);
    const upcoming = await db.execute("SELECT COUNT(*) as cnt FROM milestones WHERE due_date BETWEEN date('now') AND date('now','+14 days')").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0);
    const byStatus = await db.execute("SELECT status, COUNT(*) as cnt FROM tasks GROUP BY status")
      .then(r => Object.fromEntries((r.rows as unknown as { status: string; cnt: number }[]).map(x => [x.status, Number(x.cnt)])))
      .catch(() => ({} as Record<string, number>));
    const board = BOARD.map(b => ({ ...b, count: byStatus[b.status] ?? 0 }));

    // Chart data
    const PRIORITY_COLORS: Record<string, string> = {
      CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#3b82f6", LOW: "#94a3b8",
    };
    const priorityRows = await db.execute("SELECT priority, COUNT(*) as cnt FROM tasks GROUP BY priority")
      .then(r => r.rows as unknown as { priority: string; cnt: number }[])
      .catch(() => [] as { priority: string; cnt: number }[]);
    const priorityData: PriorityItem[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => ({
      name: p.charAt(0) + p.slice(1).toLowerCase(),
      value: Number(priorityRows.find(r => r.priority === p)?.cnt ?? 0),
      fill: PRIORITY_COLORS[p],
    }));

    const projectStatusRows = await db.execute(
      "SELECT status, COUNT(*) as cnt FROM projects GROUP BY status ORDER BY cnt DESC"
    )
      .then(r => r.rows as unknown as { status: string; cnt: number }[])
      .catch(() => [] as { status: string; cnt: number }[]);
    const projectStatusData: ProjectStatusItem[] = projectStatusRows.map(r => ({
      status: String(r.status),
      count: Number(r.cnt),
    }));

    const activityRows = await db.execute(
      "SELECT date(created_at) as day, COUNT(*) as cnt FROM tasks WHERE date(created_at) >= date('now','-30 days') GROUP BY date(created_at) ORDER BY day ASC"
    )
      .then(r => r.rows as unknown as { day: string; cnt: number }[])
      .catch(() => [] as { day: string; cnt: number }[]);
    const activityData: DailyActivity[] = activityRows.map(r => ({
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
        <KpiTile label="Total Projects" value={kpi.total} sub={`${kpi.active} active`} />
        <KpiTile label="Delayed" value={kpi.delayed} sub="health RED" />
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
