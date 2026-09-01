"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@metland/ui";

export default function ImportPage() {
  const [json, setJson] = useState('[{"company_name":"PT Test Struktur","company_code":"TEST-001","location":"Bekasi"}]');
  const [preview, setPreview] = useState<unknown>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function doPreview() {
    try {
      const rows = JSON.parse(json);
      const res = await fetch("/api/catalogue/import", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type:"contractor", rows, preview:true }) });
      const j = await res.json();
      setPreview(j);
      setMsg(null);
    } catch(e){ setMsg(String(e)); }
  }
  async function doImport() {
    const rows = JSON.parse(json);
    const res = await fetch("/api/catalogue/import", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type:"contractor", rows }) });
    const j = await res.json();
    setMsg(JSON.stringify(j, null, 2));
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-hanken)" }}>Import Data</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">MVP flow docs/PRD.md:979 — Upload Excel→Column Mapping→Validation→Preview→Import (JSON paste MVP)</p>
      <Card><CardHeader className="font-semibold">Paste JSON rows (company_name, company_code, location)</CardHeader><CardContent className="space-y-2">
        <textarea value={json} onChange={e=>setJson(e.target.value)} rows={6} className="w-full border rounded p-2 font-mono text-xs" />
        <div className="flex gap-2">
          <button onClick={doPreview} className="border rounded px-3 py-1 text-sm">Preview (validation duplicate/missing)</button>
          <button onClick={doImport} className="bg-[var(--color-primary)] text-white rounded px-3 py-1 text-sm">Import</button>
        </div>
        {preview ? <pre className="text-xs bg-[var(--color-surface-container)] p-2 rounded overflow-auto">{JSON.stringify(preview, null, 2)}</pre> : null}
        {msg ? <pre className="text-xs bg-[var(--color-surface-container)] p-2 rounded overflow-auto">{msg}</pre> : null}
      </CardContent></Card>
    </div>
  );
}
