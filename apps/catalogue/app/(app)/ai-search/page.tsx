"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, Badge } from "@metland/ui";

type Rec = { contractor: { id:string; company_name:string; company_code:string; description:string; location:string; spec_name:string }; score:number; match:string; reasons:string[]; explanation:string };

export default function AISearchPage() {
  const [q, setQ] = useState("Cari kontraktor struktur untuk proyek high rise di Bekasi");
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [recId, setRecId] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    const res = await fetch("/api/catalogue/ai-search", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ query: q }) });
    const j = await res.json();
    setRecs(j.recommendations ?? []);
    setRecId(j.recommendation_id ?? null);
    setLoading(false);
  }

  async function requestApproval(cId:string) {
    await fetch("/api/catalogue/recommendations", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ recommendation_id: recId, selected_contractor_id: cId, reason: q }) });
    alert("Approval requested — human approval required docs/PRD.md:944");
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-hanken)" }}>AI Search</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">Natural Language Query docs/PRD.md:868 — Intent → Retrieval → Ranking → Explanation (guardrail anti-halusinasi docs/PRD.md:917)</p>

      <Card className="border-l-4 border-l-[var(--color-primary)]">
        <CardContent className="p-4 flex gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 border rounded px-3 py-2 text-sm" placeholder="Cari kontraktor struktur untuk proyek high rise" />
          <button onClick={search} disabled={loading} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded text-sm">{loading? "Searching...":"AI Search"}</button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i=> <div key={i} className="h-24 bg-[var(--color-surface-container)] animate-pulse rounded-lg" />)}
        </div>
      ) : recs.length ? (
        <div className="space-y-3">
          <div className="text-sm font-semibold">Recommended Contractors</div>
          {recs.map((r, idx)=>(
            <Card key={r.contractor.id} className="border-l-4" style={{ borderLeftColor: r.match==="High" ? "var(--color-status-green)" : r.match==="Medium" ? "var(--color-status-yellow)" : "var(--color-outline-variant)" }}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <span className="font-semibold">{idx+1}. {r.contractor.company_name} <span className="font-mono text-xs text-[var(--color-data-mono)]">{r.contractor.company_code}</span></span>
                <Badge status={r.match==="High" ? "success" : r.match==="Medium" ? "warning" : "neutral"}>Match: {r.match}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-[var(--color-on-surface-variant)]">{r.contractor.description}</div>
                <div className="bg-teal-50 border border-teal-100 rounded p-2 text-xs">
                  <div className="font-semibold">Why recommended?</div>
                  <div>{r.explanation}</div>
                  <div className="mt-1 flex flex-wrap gap-1">{r.reasons.map(rr=> <span key={rr} className="text-xs">{rr}</span>)}</div>
                </div>
                <button onClick={()=>requestApproval(r.contractor.id)} className="border rounded px-3 py-1 text-xs hover:bg-[var(--color-surface-container)]">Select → Request Approval</button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-sm text-[var(--color-on-surface-variant)]">Try sample query and click AI Search — pipeline Ranking docs/PRD.md:868 will return top 5.</div>
      )}
    </div>
  );
}
