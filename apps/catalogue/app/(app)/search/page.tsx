"use client";
import { useState } from "react";
import { Card, CardContent } from "@metland/ui";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"contractor"|"material">("contractor");
  const [results, setResults] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  async function doSearch() {
    setLoading(true);
    const rs = await fetch(`/api/catalogue/search?type=${type}&q=${encodeURIComponent(q)}`).then(r=>r.json());
    setResults(rs.data ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-hanken)" }}>Catalogue Search</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">Search powerful tanpa AI — filter Category/Spec/Location/Price</p>
      <div className="flex gap-2">
        <select value={type} onChange={e=>setType(e.target.value as never)} className="border rounded px-3 py-2 text-sm"><option value="contractor">Contractor</option><option value="material">Material</option></select>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari kontraktor struktur..." className="flex-1 border rounded px-3 py-2 text-sm" />
        <button onClick={doSearch} disabled={loading} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded text-sm">{loading? "...":"Search"}</button>
      </div>
      <div className="grid gap-3">
        {results.map((r:unknown)=>{const c=r as Record<string,unknown>; return <Card key={String(c.id)}><CardContent className="p-3 text-sm"><div className="font-semibold">{String(c.company_name ?? c.name ?? JSON.stringify(c))}</div><div className="text-xs text-[var(--color-on-surface-variant)]">{String(c.company_code ?? c.category_name ?? "")} {String(c.location ?? "")}</div></CardContent></Card>;})}
        {results.length===0 && !loading ? <div className="text-sm text-[var(--color-on-surface-variant)]">No results yet — try POST some contractors first.</div> : null}
      </div>
    </div>
  );
}
