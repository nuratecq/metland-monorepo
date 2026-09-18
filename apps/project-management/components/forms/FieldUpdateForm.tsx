"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FieldUpdateForm({ projectId, onDone }: { projectId: string; onDone?: () => void }) {
  const r = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(50);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body = { progress, note: String(fd.get("note") ?? "") };
    const res = await fetch(`/api/projects/${projectId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg({ type: "err", text: String(j.error ?? "Gagal memperbarui") });
    } else {
      setMsg({ type: "ok", text: `Progres diperbarui → ${j.data.progress}%` });
      onDone?.();
      r.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div className="font-semibold text-[15px]" style={{ fontFamily: "var(--font-hanken)" }}>Unggah Progres</div>

      {/* Progress slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-medium text-[var(--color-on-surface-variant)]">
            Progres keseluruhan
          </label>
          <span className="font-mono text-[14px] font-bold text-[var(--color-primary)]">{progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-outline)] mt-0.5">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-[12px] font-medium text-[var(--color-on-surface-variant)] mb-1.5">
          Catatan (opsional)
        </label>
        <textarea
          name="note"
          rows={2}
          placeholder="Pekerjaan pondasi sisi timur selesai..."
          className="w-full px-3 py-2 bg-[var(--color-surface-container-low)] rounded-lg text-[13px] border border-transparent focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
        />
      </div>

      <button
        disabled={loading}
        className="w-full h-9 rounded-lg bg-[var(--color-primary)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Menyimpan..." : "Simpan Progres"}
      </button>

      {msg && (
        <div
          className="text-[12px] px-3 py-2 rounded-lg"
          style={{
            background: msg.type === "ok" ? "#f0fdf4" : "#fef2f2",
            color: msg.type === "ok" ? "#16a34a" : "#dc2626",
          }}
        >
          {msg.text}
        </div>
      )}
    </form>
  );
}
