import { getDb } from "@/lib/turso";
import { ApprovalActions } from "@/components/forms/ApprovalActions";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

type Approval = {
  id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  reason: string | null;
  created_at: string;
  entity_name: string | null;
  requester_name: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:      { label: "Draft",       color: "#64748b", bg: "#f1f5f9" },
  SUBMITTED:  { label: "Submitted",   color: "#2563eb", bg: "#eff6ff" },
  IN_REVIEW:  { label: "In Review",   color: "#d97706", bg: "#fef3c7" },
  APPROVED:   { label: "Approved",    color: "#16a34a", bg: "#f0fdf4" },
  REJECTED:   { label: "Rejected",    color: "#dc2626", bg: "#fef2f2" },
  REVISION:   { label: "Revision",    color: "#7c3aed", bg: "#f5f3ff" },
};

const ENTITY_LABEL: Record<string, string> = {
  project:  "Project",
  document: "Dokumen",
  task:     "Task",
  approval: "Approval",
};

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ApprovalsPage() {
  const db = getDb();
  let approvals: Approval[] = [];

  try {
    const rs = await db.execute(`
      SELECT a.id, a.entity_type, a.entity_id, a.status, a.reason, a.created_at,
             p.name  AS entity_name,
             u.name  AS requester_name
      FROM approvals a
      LEFT JOIN projects p ON p.id = a.entity_id
      LEFT JOIN users    u ON u.id = a.requester_id
      ORDER BY a.created_at DESC
      LIMIT 50
    `);
    approvals = (rs.rows as unknown as Record<string, unknown>[]).map((r) => ({
      id:             String(r.id ?? ""),
      entity_type:    String(r.entity_type ?? ""),
      entity_id:      String(r.entity_id ?? ""),
      status:         String(r.status ?? "DRAFT"),
      reason:         r.reason != null ? String(r.reason) : null,
      created_at:     String(r.created_at ?? ""),
      entity_name:    r.entity_name != null ? String(r.entity_name) : null,
      requester_name: r.requester_name != null ? String(r.requester_name) : null,
    }));
  } catch {}

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Approvals</h1>
        <p className="text-sm text-[var(--color-on-surface-variant)]">{approvals.length} approval request</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-on-surface-variant)]">
            <ShieldCheck size={36} className="opacity-25 mb-3" />
            <p className="text-sm font-medium">Belum ada approval request.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[110px]">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)]">Entity</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[140px]">Requester</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[120px]">Submitted</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => {
                const st = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.DRAFT;
                return (
                  <tr
                    key={a.id}
                    className="border-b border-[var(--color-outline-variant)] last:border-0 hover:bg-[var(--color-surface-container-low)] transition-colors"
                  >
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex h-[20px] items-center px-2 rounded text-[11px] font-semibold"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: "#f1f5f9", color: "#64748b" }}
                        >
                          {ENTITY_LABEL[a.entity_type] ?? a.entity_type}
                        </span>
                        <span className="font-medium text-[var(--color-on-surface)] truncate max-w-[220px]">
                          {a.entity_name ?? a.entity_id.slice(0, 8)}
                        </span>
                      </div>
                      {a.reason && (
                        <div className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5 truncate max-w-[320px]">
                          {a.reason}
                        </div>
                      )}
                    </td>

                    {/* Requester */}
                    <td className="px-4 py-3 text-[13px] text-[var(--color-on-surface-variant)]">
                      {a.requester_name ?? <span className="text-[var(--color-outline)]">—</span>}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[12px] font-mono text-[var(--color-on-surface-variant)]">
                      {a.created_at ? formatDate(a.created_at) : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <ApprovalActions approvalId={a.id} status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
