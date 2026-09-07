"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProjectForm() {
  const r = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") ?? ""),
      description: String(fd.get("description") ?? ""),
      location_text: String(fd.get("location_text") ?? ""),
      start_date: String(fd.get("start_date") ?? "") || undefined,
      planned_end_date: String(fd.get("planned_end_date") ?? "") || undefined,
    };
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) setErr(JSON.stringify(j.error ?? j));
    else r.push(`/projects/${j.data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 bg-white border rounded-lg p-4">
      {err ? <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-2 rounded">{err}</div> : null}
      <div><label className="text-xs font-semibold tracking-widest uppercase">Project Name *</label><input name="name" required className="w-full border rounded px-3 py-2 text-sm" placeholder="Renovasi Kantor Pusat" /></div>
      <div><label className="text-xs font-semibold tracking-widest uppercase">Description</label><textarea name="description" className="w-full border rounded px-3 py-2 text-sm" rows={3} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold tracking-widest uppercase">Location</label><input name="location_text" className="w-full border rounded px-3 py-2 text-sm" placeholder="Jakarta" /></div>
        <div><label className="text-xs font-semibold tracking-widest uppercase">Start Date</label><input name="start_date" type="date" className="w-full border rounded px-3 py-2 text-sm" /></div>
      </div>
      <div><label className="text-xs font-semibold tracking-widest uppercase">Planned End</label><input name="planned_end_date" type="date" className="w-full border rounded px-3 py-2 text-sm" /></div>
      <button disabled={loading} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded text-sm disabled:opacity-50">{loading ? "Saving..." : "Create Project"}</button>
    </form>
  );
}
