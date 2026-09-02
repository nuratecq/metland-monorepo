import { Suspense } from "react";
import { Card, CardContent, CardHeader, KpiTile, Table, Th, Td } from "@metland/ui";
import { ReportControls } from "@/components/reports/ReportControls";
import { asDate, catalogueReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

type Params = { from?: string; to?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const report = await catalogueReport({ from: asDate(params.from), to: asDate(params.to) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Reports</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Periode: {report.period.from ?? "awal data"} — {report.period.to ?? "sekarang"}
          </p>
        </div>
        <Suspense fallback={null}>
          <ReportControls exportPath="/api/catalogue/reports" />
        </Suspense>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-on-surface-variant)]">Catalogue Coverage</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile label="Contractors" value={report.contractors} />
          <KpiTile label="Materials" value={report.materials} />
          <KpiTile label="With Portfolio" value={report.contractorsWithPortfolio} />
          <KpiTile label="Portfolio Coverage" value={`${report.portfolioCoverageRate}%`} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-on-surface-variant)]">Recommendation & Approval</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile label="Recommendations" value={report.recommendations} />
          <KpiTile label="Approval Requests" value={report.approvalsTotal} />
          <KpiTile label="Recommendation → Approval" value={`${report.recommendationToApprovalRate}%`} />
          <KpiTile label="Avg Turnaround" value={`${report.avgApprovalTurnaroundHours} jam`} />
        </div>
      </div>

      <Card>
        <CardHeader className="font-semibold">Approval by Status</CardHeader>
        <CardContent>
          <Table>
            <thead><tr><Th className="text-left">Status</Th><Th className="text-right">Count</Th></tr></thead>
            <tbody>
              {report.approvalsByStatus.map((a) => (
                <tr key={String(a.status)}><Td>{a.status}</Td><Td className="text-right">{a.cnt}</Td></tr>
              ))}
              {!report.approvalsByStatus.length && (
                <tr><Td colSpan={2} className="text-[var(--color-on-surface-variant)]">Tidak ada approval pada periode ini.</Td></tr>
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
