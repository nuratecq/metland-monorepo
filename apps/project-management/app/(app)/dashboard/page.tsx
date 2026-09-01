import { KpiTile } from "@metland/ui";
import { Card, CardContent, CardHeader } from "@metland/ui";
import { Badge } from "@metland/ui";
import { HealthMeter } from "@metland/ui";
import { getDb } from "@/lib/turso";

export const dynamic = "force-dynamic";

async function getKpi() {
  try {
    const db = getDb();
    const total = await db.execute("SELECT COUNT(*) as cnt FROM projects").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt));
    const active = await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE status='ACTIVE'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt));
    const delayed = await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='RED'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt));
    const atRisk = await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='YELLOW'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt));
    const overdueTasks = await db.execute("SELECT COUNT(*) as cnt FROM tasks WHERE due_date < date('now') AND status != 'DONE'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0);
    const upcoming = await db.execute("SELECT COUNT(*) as cnt FROM milestones WHERE due_date BETWEEN date('now') AND date('now','+14 days')").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0);
    return { total, active, delayed, atRisk, overdueTasks, upcoming };
  } catch {
    return { total: 0, active: 0, delayed: 0, atRisk: 0, overdueTasks: 0, upcoming: 0 };
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
          <CardHeader className="font-semibold">Phase 1 — PM Core</CardHeader>
          <CardContent className="text-sm text-[var(--color-on-surface-variant)] space-y-2">
            <p>✅ Projects CRUD <code>/api/projects</code></p>
            <p>✅ Milestones & Tasks per project</p>
            <p>✅ Issues & schedule pages</p>
            <p>✅ Dashboard KPI aggregation</p>
            <p>Try: <code>POST /api/projects {"{"} name: &quot;Metland X&quot; {"}"}</code></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
