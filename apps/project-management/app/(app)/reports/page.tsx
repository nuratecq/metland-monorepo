import { Card, CardContent, CardHeader } from "@metland/ui";
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Reports</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">Project Summary + Dashboard Report docs/PRD.md:657 — export CSV</p>
      <Card><CardHeader className="font-semibold">Dashboard Report</CardHeader><CardContent className="space-y-2 text-sm">
        <a href="/api/reports" target="_blank" className="inline-block bg-[var(--color-primary)] text-white px-3 py-1.5 rounded">GET /api/reports (JSON)</a>
        <span className="text-[var(--color-on-surface-variant)]"> — counts by status/health + overdue tasks</span>
      </CardContent></Card>
      <Card><CardHeader className="font-semibold">Project Summary</CardHeader><CardContent className="text-sm space-y-1">
        <div>Get per project: <code className="bg-[var(--color-surface-container)] px-1">/api/reports?project_id=PRJ-MENTENG_ID</code></div>
        <div>CSV export: <code className="bg-[var(--color-surface-container)] px-1">/api/reports?project_id=ID&format=csv</code></div>
        <div className="text-xs text-[var(--color-on-surface-variant)]">Future: PDF/Excel via pdfkit/exceljs — MVP JSON/CSV</div>
      </CardContent></Card>
    </div>
  );
}
