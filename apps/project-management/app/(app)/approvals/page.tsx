import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader, Badge } from "@metland/ui";
export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const db = getDb();
  let approvals: unknown[] = [];
  try { const rs = await db.execute("SELECT a.*, p.name as entity_name FROM approvals a LEFT JOIN projects p ON p.id=a.entity_id ORDER BY a.created_at DESC LIMIT 30"); approvals = rs.rows; } catch {}
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Approvals</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">Workflow docs/PRD.md:589 — DRAFT→SUBMITTED→IN_REVIEW→APPROVED / REJECTED→REVISION</p>
      <Card><CardHeader className="font-semibold">Approval Requests</CardHeader><CardContent className="space-y-2">
        {approvals.length===0 ? <span className="text-sm text-[var(--color-on-surface-variant)]">No approvals — create via <code>POST /api/approvals</code></span> : approvals.map((r:unknown)=>{
          const a=r as Record<string,unknown>;
          return <div key={String(a.id)} className="border rounded p-3 flex justify-between text-sm"><span><span className="font-medium">{String(a.entity_type)}</span> <span className="font-mono text-xs">{String(a.entity_id).slice(0,8)}</span> — {String(a.entity_name ?? "")}</span><Badge status={String(a.status)==="APPROVED" ? "success" : String(a.status)==="REJECTED" ? "critical" : String(a.status)==="SUBMITTED" ? "info" : "neutral"}>{String(a.status)}</Badge></div>;
        })}
      </CardContent></Card>
      <Card><CardContent className="p-4 text-sm space-y-1">
        <div className="font-semibold">API quick test</div>
        <code className="block bg-[var(--color-surface-container)] p-2 rounded text-xs">POST /api/approvals {"{"} entity_type:"project", entity_id:"PRJ-MENTENG", reason:"Request approval" {"}"}</code>
        <code className="block bg-[var(--color-surface-container)] p-2 rounded text-xs">POST /api/approvals/:id {"{"} decision:"APPROVED", approver_id:"mgr_1", comment:"OK" {"}"}</code>
      </CardContent></Card>
    </div>
  );
}
