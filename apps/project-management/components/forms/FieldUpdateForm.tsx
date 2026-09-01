"use client";
import { useState } from "react";

export function FieldUpdateForm({ projectId, onDone }: { projectId: string; onDone?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = { progress: Number(fd.get("progress")), note: String(fd.get("note") ?? "") };
    const res = await fetch(`/api/projects/${projectId}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) setMsg(JSON.stringify(j.error ?? j));
    else { setMsg(`Updated → ${j.data.progress}% health ${j.health}`); onDone?.(); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 bg-white border rounded-lg p-4">
      <div className="font-semibold text-sm">Field Update — docs/PRD.md:478</div>
      <div><label className="text-xs font-semibold tracking-widest uppercase">Progress 0-100</label><input name="progress" type="range" min={0} max={100} defaultValue={50} className="w-full" /></div>
      <div><label className="text-xs font-semibold tracking-widest uppercase">Note</label><textarea name="note" className="w-full border rounded px-3 py-2 text-sm" placeholder="Pekerjaan pondasi sisi timur selesai" rows={2} /></div>
      <button disabled={loading} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded text-sm">{loading ? "..." : "Submit Field Update"}</button>
      {msg ? <div className="text-xs text-[var(--color-on-surface-variant)]">{msg}</div> : null}
    </form>
  );
}
