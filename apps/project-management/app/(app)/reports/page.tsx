import { Suspense } from "react";
import { Card, CardContent, CardHeader, KpiTile, Badge, Table, Th, Td } from "@metland/ui";
import { getDb } from "@/lib/turso";
import { ReportControls } from "@/components/reports/ReportControls";
import { asDate, dashboardReport, projectSummary, type Row } from "@/lib/reports";

export const dynamic = "force-dynamic";

type Params = { project_id?: string; from?: string; to?: string };

async function listProjects() {
  try {
    const r = await getDb().execute("SELECT id, name FROM projects ORDER BY name");
    return (r.rows as Row[]).map((p) => ({ id: String(p.id), name: String(p.name) }));
  } catch {
    return [];
  }
}

function Period({ period }: { period: { from: string | null; to: string | null } }) {
  return (
    <p className="text-sm text-[var(--color-on-surface-variant)]">
      Periode: {period.from ?? "awal data"} — {period.to ?? "sekarang"}
    </p>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const period = { from: asDate(params.from), to: asDate(params.to) };
  const [report, projects] = await Promise.all([
    params.project_id ? projectSummary(params.project_id, period) : dashboardReport(period),
    listProjects(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Reports</h1>
          {report && <Period period={report.period} />}
        </div>
        <Suspense fallback={null}>
          <ReportControls projects={projects} exportPath="/api/reports" />
        </Suspense>
      </div>

      {!report && (
        <Card><CardContent className="text-sm text-[var(--color-on-surface-variant)]">Data laporan tidak tersedia.</CardContent></Card>
      )}

      {report?.kind === "dashboard" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile label="Total Project" value={report.total} />
            <KpiTile label="On Track" value={report.onTrack} />
            <KpiTile label="At Risk" value={report.atRisk} />
            <KpiTile label="Delayed" value={report.delayed} />
            <KpiTile label="Completed" value={report.completed} />
            <KpiTile label="Completion" value={`${report.completionRate}%`} />
            <KpiTile label="Overdue Tasks" value={report.overdueTasks} />
          </div>
          <Card>
            <CardHeader className="font-semibold">Project by Status</CardHeader>
            <CardContent>
              <Table>
                <thead><tr><Th className="text-left">Status</Th><Th className="text-right">Count</Th></tr></thead>
                <tbody>
                  {report.byStatus.map((r) => (
                    <tr key={String(r.status)}><Td>{r.status}</Td><Td className="text-right">{r.cnt}</Td></tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {report?.kind === "project" && (
        <>
          <Card>
            <CardHeader className="flex items-center justify-between">
              <span className="font-semibold">{String(report.project.name)}</span>
              <Badge status={report.project.health_status === "RED" ? "critical" : report.project.health_status === "YELLOW" ? "warning" : "success"}>
                {String(report.project.health_status)}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-4">
              <KpiTile label="Progress" value={`${report.project.progress}%`} />
              <KpiTile label="Status" value={String(report.project.status)} />
              <KpiTile label="Overdue Tasks" value={report.overdue_tasks} />
              <KpiTile label="Milestones" value={report.milestones.length} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="font-semibold">Milestones</CardHeader>
            <CardContent>
              <Table>
                <thead><tr><Th className="text-left">Name</Th><Th className="text-left">Status</Th><Th className="text-right">Completion</Th><Th className="text-left">Due</Th></tr></thead>
                <tbody>
                  {report.milestones.map((m, i) => (
                    <tr key={i}><Td>{m.name}</Td><Td>{m.status}</Td><Td className="text-right">{m.completion_percentage}%</Td><Td>{m.due_date ?? "—"}</Td></tr>
                  ))}
                  {!report.milestones.length && <tr><Td colSpan={4} className="text-[var(--color-on-surface-variant)]">Tidak ada milestone pada periode ini.</Td></tr>}
                </tbody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="font-semibold">Task Status</CardHeader>
              <CardContent>
                <Table>
                  <thead><tr><Th className="text-left">Status</Th><Th className="text-right">Count</Th></tr></thead>
                  <tbody>
                    {report.task_status.map((t) => (<tr key={String(t.status)}><Td>{t.status}</Td><Td className="text-right">{t.cnt}</Td></tr>))}
                    {!report.task_status.length && <tr><Td colSpan={2} className="text-[var(--color-on-surface-variant)]">—</Td></tr>}
                  </tbody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="font-semibold">Issues</CardHeader>
              <CardContent>
                <Table>
                  <thead><tr><Th className="text-left">Severity</Th><Th className="text-left">Status</Th><Th className="text-right">Count</Th></tr></thead>
                  <tbody>
                    {report.issue_status.map((r, i) => (<tr key={i}><Td>{r.severity}</Td><Td>{r.status}</Td><Td className="text-right">{r.cnt}</Td></tr>))}
                    {!report.issue_status.length && <tr><Td colSpan={3} className="text-[var(--color-on-surface-variant)]">—</Td></tr>}
                  </tbody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="font-semibold">Conclusion</CardHeader>
            <CardContent className="text-sm">{String(report.conclusion)}</CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
