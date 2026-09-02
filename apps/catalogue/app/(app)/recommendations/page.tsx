import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader } from "@metland/ui";
export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const db = getDb();
  let recs: unknown[] = []; let approvals: unknown[] = [];
  try { const r=await db.execute("SELECT * FROM recommendations ORDER BY created_at DESC LIMIT 10"); recs=r.rows; } catch {}
  try { const a=await db.execute("SELECT * FROM approval_requests ORDER BY created_at DESC LIMIT 10"); approvals=a.rows; } catch {}
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-hanken)" }}>Recommendations & Approvals</h1>
      <Card><CardHeader className="font-semibold">Recommendations ({recs.length})</CardHeader><CardContent className="space-y-2 text-sm">{recs.length===0?<span className="text-[var(--color-on-surface-variant)]">No recommendations yet — use AI Search</span>: recs.map((r:unknown)=>{const rr=r as Record<string,unknown>; return <div key={String(rr.id)} className="border rounded p-2"><div className="font-medium">{String(rr.query)}</div><div className="text-xs font-mono">{String(rr.id).slice(0,8)} • {String(rr.created_at)}</div></div>;})}</CardContent></Card>
      <Card><CardHeader className="font-semibold">Approval Requests ({approvals.length})</CardHeader><CardContent className="space-y-2 text-sm">{approvals.length===0?<span className="text-[var(--color-on-surface-variant)]">No approvals yet</span>: approvals.map((a:unknown)=>{const aa=a as Record<string,unknown>; return <div key={String(aa.id)} className="border rounded p-2"><div>{String(aa.status)} — {String(aa.recommendation_id).slice(0,8)}</div><div className="text-xs">{String(aa.reason ?? "")}</div></div>;})}</CardContent></Card>
    </div>
  );
}
