import Link from "next/link";
import { getDb } from "@/lib/turso";
import { FolderKanban, AlertTriangle, Clock, Zap } from "lucide-react";
import {
  ProjectStatusBar,
  TaskActivityLine,
  TaskBoardHorizontal,
  ProjectHealthPie,
  type ProjectStatusItem,
  type DailyActivity,
  type BoardItem,
} from "./charts";

export const dynamic = "force-dynamic";

const BOARD: BoardItem[] = [
  { status: "TODO",        label: "To Do",      count: 0, color: "#94a3b8" },
  { status: "IN_PROGRESS", label: "In Progress", count: 0, color: "#006767" },
  { status: "BLOCKED",     label: "Blocked",     count: 0, color: "#ef4444" },
  { status: "DONE",        label: "Done",        count: 0, color: "#22c55e" },
];

function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ size: number }>;
  iconBg: string;
  iconColor: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-xl shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium text-[var(--color-on-surface-variant)]">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={15} />
        </div>
      </div>
      <div
        className="text-[2rem] font-bold tracking-tight text-[var(--color-on-surface)] leading-none"
        style={{ fontFamily: "var(--font-hanken)", color: iconColor }}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[12px] text-[var(--color-on-surface-variant)]">{sub}</div>}
    </div>
  );
  if (href) return <Link href={href} className="block hover:opacity-90 transition-opacity">{inner}</Link>;
  return inner;
}

async function getKpi() {
  try {
    const db = getDb();
    const [projectKpi, overdueTasks, upcoming, byStatusRs, projectStatusRs, activityRs] =
      await Promise.all([
        db.execute(`
          SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN status='ACTIVE' THEN 1 END) as active,
            COUNT(CASE WHEN health_status='RED' THEN 1 END) as delayed,
            COUNT(CASE WHEN health_status='YELLOW' THEN 1 END) as at_risk
          FROM projects
        `).then((r) => r.rows[0] as unknown as Record<string, number>),
        db.execute("SELECT COUNT(*) as cnt FROM tasks WHERE due_date < date('now') AND status != 'DONE'")
          .then((r) => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0),
        db.execute("SELECT COUNT(*) as cnt FROM milestones WHERE due_date BETWEEN date('now') AND date('now','+14 days')")
          .then((r) => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0),
        db.execute("SELECT status, COUNT(*) as cnt FROM tasks GROUP BY status")
          .then((r) => r.rows as unknown as { status: string; cnt: number }[]).catch(() => []),
        db.execute("SELECT status, COUNT(*) as cnt FROM projects GROUP BY status ORDER BY cnt DESC")
          .then((r) => r.rows as unknown as { status: string; cnt: number }[]).catch(() => []),
        db.execute("SELECT date(created_at) as day, COUNT(*) as cnt FROM tasks WHERE date(created_at) >= date('now','-30 days') GROUP BY date(created_at) ORDER BY day ASC")
          .then((r) => r.rows as unknown as { day: string; cnt: number }[]).catch(() => []),
      ]);

    const total = Number(projectKpi.total ?? 0);
    const active = Number(projectKpi.active ?? 0);
    const delayed = Number(projectKpi.delayed ?? 0);
    const atRisk = Number(projectKpi.at_risk ?? 0);
    const onTrackPct = total ? Math.round(((total - delayed - atRisk) / total) * 100) : 0;

    const byStatus = Object.fromEntries(byStatusRs.map((x) => [x.status, Number(x.cnt)]));
    const board = BOARD.map((b) => ({ ...b, count: byStatus[b.status] ?? 0 }));
    const taskTotal = board.reduce((s, b) => s + b.count, 0);
    const activityTotal = activityRs.reduce((s, r) => s + Number(r.cnt), 0);

    const projectStatusData: ProjectStatusItem[] = projectStatusRs.map((r) => ({
      status: String(r.status),
      count: Number(r.cnt),
    }));
    const activityData: DailyActivity[] = activityRs.map((r) => ({
      day: String(r.day),
      tasks: Number(r.cnt),
    }));

    return { total, active, delayed, atRisk, overdueTasks, upcoming, board, taskTotal, onTrackPct, activityTotal, projectStatusData, activityData };
  } catch {
    return {
      total: 0, active: 0, delayed: 0, atRisk: 0, overdueTasks: 0, upcoming: 0,
      board: BOARD.map((b) => ({ ...b, count: 0 })), taskTotal: 0, onTrackPct: 0, activityTotal: 0,
      projectStatusData: [] as ProjectStatusItem[],
      activityData: [] as DailyActivity[],
    };
  }
}

export default async function Dashboard() {
  const kpi = await getKpi();

  const now = new Date();
  const monthLabel = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Dashboard</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Operational overview — {monthLabel}</p>
        </div>
        <Link
          href="/projects/new"
          className="h-9 px-4 flex items-center bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Proyek baru
        </Link>
      </div>

      {/* 4 KPI stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={kpi.total}
          sub={`${kpi.active} aktif`}
          icon={FolderKanban}
          iconBg="rgba(0,103,103,0.1)"
          iconColor="var(--color-primary)"
          href="/projects"
        />
        <StatCard
          label="Active"
          value={kpi.active}
          sub="sedang berjalan"
          icon={Zap}
          iconBg="rgba(59,130,246,0.1)"
          iconColor="#3b82f6"
          href="/projects"
        />
        <StatCard
          label="Delayed"
          value={kpi.delayed}
          sub="health RED"
          icon={AlertTriangle}
          iconBg="rgba(239,68,68,0.1)"
          iconColor="#ef4444"
          href="/projects"
        />
        <StatCard
          label="Overdue Tasks"
          value={kpi.overdueTasks}
          sub={`${kpi.upcoming} milestones 14 hari`}
          icon={Clock}
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#f59e0b"
          href="/tasks"
        />
      </div>

      {/* Main row: task activity (wide) + projects by status */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Task Activity — wide card */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[13px] font-medium text-[var(--color-on-surface-variant)] mb-1">Task Activity</div>
              <div
                className="text-[2.25rem] font-bold tracking-tight text-[var(--color-on-surface)] leading-none"
                style={{ fontFamily: "var(--font-hanken)" }}
              >
                {kpi.activityTotal}
              </div>
              <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-1">tasks dibuat 30 hari terakhir</div>
            </div>
          </div>
          <TaskActivityLine data={kpi.activityData} />
        </div>

        {/* Projects by Status */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="text-[13px] font-medium text-[var(--color-on-surface-variant)] mb-4">Projects by Status</div>
          <ProjectStatusBar data={kpi.projectStatusData} />
        </div>
      </div>

      {/* Second row: task board horizontal bar + project health pie */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Task Board horizontal bar chart */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-medium text-[var(--color-on-surface-variant)]">Task Board</span>
            <Link href="/tasks" className="text-[12px] text-[var(--color-primary)] hover:underline">Buka board →</Link>
          </div>
          <TaskBoardHorizontal board={kpi.board} />
        </div>

        {/* Project Health donut pie */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 flex flex-col">
          <div className="text-[13px] font-medium text-[var(--color-on-surface-variant)] mb-2">Project Health</div>
          <ProjectHealthPie
            onTrack={kpi.total - kpi.delayed - kpi.atRisk}
            atRisk={kpi.atRisk}
            delayed={kpi.delayed}
          />
        </div>
      </div>
    </div>
  );
}
