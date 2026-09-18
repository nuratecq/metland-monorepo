"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

const CATEGORIES = ["Contract", "Drawing", "Report", "Approval", "Photo", "Technical Document", "Other"];

const inputCls = "w-full h-9 px-3 bg-[var(--color-surface-container-low)] rounded-lg text-[13px] border border-transparent focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]";
const labelCls = "block text-[12px] font-medium text-[var(--color-on-surface-variant)] mb-1.5";

export function DocumentUpload({ projectId }: { projectId: string }) {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file") as File | null;
    if (!file || file.size === 0) return setMsg({ type: "err", text: "Pilih file dulu" });

    setBusy(true);
    setMsg(null);
    try {
      // 1. presign
      const pres = await fetch("/api/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mime: file.type, size: file.size, entity: "project", entityId: projectId }),
      });
      const p = await pres.json();
      if (!pres.ok) throw new Error(typeof p.error === "string" ? p.error : "Presign ditolak");
      if (!p.url) throw new Error("R2 belum dikonfigurasi — upload tidak tersedia");

      // 2. upload to R2
      const put = await fetch(p.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Upload gagal (${put.status})`);

      // 3. record document row
      const doc = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          r2_key: p.key,
          mime_type: file.type,
          file_size: file.size,
          category: String(fd.get("category") ?? "Other"),
        }),
      });
      if (!doc.ok) throw new Error("File terunggah tapi gagal dicatat");

      setMsg({ type: "ok", text: `Terunggah: ${file.name}` });
      setFileName(null);
      form.reset();
      r.refresh();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Gagal mengunggah" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-4 md:col-span-2">
      <div className="font-semibold text-[15px]" style={{ fontFamily: "var(--font-hanken)" }}>Unggah Dokumen</div>

      {/* File dropzone-style input */}
      <div>
        <label className={labelCls}>File</label>
        <label
          htmlFor="doc-file"
          className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-[var(--color-outline-variant)] rounded-xl bg-[var(--color-surface-container-low)] cursor-pointer hover:border-[var(--color-primary)] hover:bg-[#f0fbfa] transition-colors"
        >
          {fileName ? (
            <>
              <FileText size={20} className="text-[var(--color-primary)]" />
              <span className="text-[13px] font-medium text-[var(--color-on-surface)]">{fileName}</span>
            </>
          ) : (
            <>
              <span className="text-[13px] text-[var(--color-on-surface-variant)]">Klik untuk pilih file</span>
              <span className="text-[11px] text-[var(--color-outline)]">PDF, XLSX, JPG, PNG, WEBP</span>
            </>
          )}
          <input
            id="doc-file"
            name="file"
            type="file"
            required
            accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="doc-category" className={labelCls}>Kategori</label>
        <select id="doc-category" name="category" className={`${inputCls} cursor-pointer`}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <button
        disabled={busy}
        className="w-full h-9 rounded-lg bg-[var(--color-primary)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      >
        {busy ? "Mengunggah..." : "Upload Dokumen"}
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
