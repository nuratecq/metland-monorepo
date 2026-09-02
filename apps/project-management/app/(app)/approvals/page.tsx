import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader, Badge } from "@metland/ui";
import { ApprovalActions } from "@/components/forms/ApprovalActions";
export const dynamic = "force-dynamic";

function badgeFor(status: string) {
  return status === "APPROVED" ? "success" : status === "REJECTED" ? "critical" : status === "SUBMITTED" ? "info" : "neutral";
}

export default async function ApprovalsPage() {
  const db = getDb();
  let approvals: Record<string, unknown>[] = [];
  try {
    const rs = await db.execute(
      "SELECT a.*, p.name as entity_name FROM approvals a LEFT JOIN projects p ON p.id=a.entity_id ORDER BY a.created_at DESC LIMIT 30"
    );
    approvals = rs.rows as unknown as Record<string, unknown>[];
  } catch {}

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Approvals</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">Workflow docs/PRD.md:589 — DRAFT→SUBMITTED→IN_REVIEW→APPROVED / REJECTED→REVISION</p>
      <Card>
        <CardHeader className="font-semibold">Approval Requests</CardHeader>
        <CardContent className="space-y-2">
          {approvals.length === 0 ? (
            <span className="text-sm text-[var(--color-on-surface-variant)]">Belum ada approval</span>
          ) : (
            approvals.map((a) => (
              <div key={String(a.id)} className="border rounded p-3 flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{String(a.entity_type)}</span>{" "}
                  <span className="font-mono text-xs">{String(a.entity_id).slice(0, 8)}</span> — {String(a.entity_name ?? "")}
                  {a.reason ? <span className="block text-xs text-[var(--color-on-surface-variant)]">{String(a.reason)}</span> : null}
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <ApprovalActions approvalId={String(a.id)} status={String(a.status)} />
                  <Badge status={badgeFor(String(a.status))}>{String(a.status)}</Badge>
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
