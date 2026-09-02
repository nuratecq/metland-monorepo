import { getDb } from "@/lib/turso";
import type { Sheet } from "@/lib/export";

/** Catalogue reporting docs/PRD.md:1536 — coverage, recommendation usage, approval turnaround. */

export type Row = Record<string, string | number | null>;
export type Period = { from: string | null; to: string | null };

const n = (r: { rows: unknown[] }) => Number((r.rows[0] as Row)?.cnt ?? 0);

/** ISO date (YYYY-MM-DD) only — anything else becomes null rather than reaching SQL. */
export const asDate = (s: string | null | undefined): string | null =>
  s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;

export type CatalogueReport = {
  period: Period;
  contractors: number;
  materials: number;
  contractorsWithPortfolio: number;
  portfolioCoverageRate: number;
  recommendations: number;
  approvalsTotal: number;
  approvalsByStatus: Row[];
  recommendationToApprovalRate: number;
  avgApprovalTurnaroundHours: number;
};

export async function catalogueReport(period: Period): Promise<CatalogueReport> {
  const db = getDb();
  const clause = (col: string) =>
    `${period.from ? ` AND date(${col}) >= date(?)` : ""}${period.to ? ` AND date(${col}) <= date(?)` : ""}`;
  const args = [period.from, period.to].filter((v): v is string => v !== null);

  const contractors = n(await db.execute("SELECT COUNT(*) as cnt FROM contractors"));
  const materials = n(await db.execute("SELECT COUNT(*) as cnt FROM materials"));
  const withPortfolio = n(await db.execute("SELECT COUNT(DISTINCT contractor_id) as cnt FROM contractor_portfolios"));
  const recommendations = n(await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM recommendations WHERE 1=1${clause("created_at")}`,
    args,
  }));
  const approvals = await db.execute({
    sql: `SELECT status, COUNT(*) as cnt FROM approval_requests WHERE 1=1${clause("created_at")} GROUP BY status`,
    args,
  });
  const approvalsByStatus = approvals.rows as Row[];
  const approvalsTotal = approvalsByStatus.reduce((a, r) => a + Number(r.cnt), 0);

  // Turnaround: hours from request to its first decision. Undecided rows fall out of AVG.
  const turnaround = await db.execute({
    sql: `SELECT AVG((julianday(a.created_at) - julianday(r.created_at)) * 24) as cnt
          FROM approval_requests r JOIN approval_actions a ON a.approval_id = r.id
          WHERE 1=1${clause("r.created_at")}`,
    args,
  });

  return {
    period,
    contractors,
    materials,
    contractorsWithPortfolio: withPortfolio,
    portfolioCoverageRate: contractors ? Math.round((withPortfolio / contractors) * 100) : 0,
    recommendations,
    approvalsTotal,
    approvalsByStatus,
    recommendationToApprovalRate: recommendations ? Math.round((approvalsTotal / recommendations) * 100) : 0,
    avgApprovalTurnaroundHours: Math.round(Number((turnaround.rows[0] as Row)?.cnt ?? 0) * 10) / 10,
  };
}

export function catalogueSheets(r: CatalogueReport): Sheet[] {
  return [
    {
      name: "Catalogue Report",
      rows: [
        ["Metric", "Value"],
        ["Reporting Period", `${r.period.from ?? "awal"} s/d ${r.period.to ?? "sekarang"}`],
        ["Contractors", r.contractors],
        ["Materials", r.materials],
        ["Contractors with Portfolio", r.contractorsWithPortfolio],
        ["Portfolio Coverage (%)", r.portfolioCoverageRate],
        ["Recommendations", r.recommendations],
        ["Approval Requests", r.approvalsTotal],
        ["Recommendation to Approval (%)", r.recommendationToApprovalRate],
        ["Avg Approval Turnaround (hours)", r.avgApprovalTurnaroundHours],
      ],
    },
    { name: "Approvals", rows: [["Status", "Count"], ...r.approvalsByStatus.map((a) => [a.status, a.cnt])] },
  ];
}
