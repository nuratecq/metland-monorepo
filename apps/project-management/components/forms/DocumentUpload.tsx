"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@metland/ui";

const CATEGORIES = ["Contract", "Drawing", "Report", "Approval", "Photo", "Technical Document", "Other"];

export function DocumentUpload({ projectId }: { projectId: string }) {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file") as File | null;
    if (!file || file.size === 0) return setMsg("Pilih file dulu");

    setBusy(true);
    setMsg(null);
    try {
      // 1. presign — server validates MIME/size and mints the randomized R2 key
      const pres = await fetch("/api/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mime: file.type, size: file.size, entity: "project", entityId: projectId }),
      });
      const p = await pres.json();
      if (!pres.ok) throw new Error(typeof p.error === "string" ? p.error : "Presign ditolak");

      // 2. upload straight to R2. Without R2 env the API returns url:null, and
      // there is no bucket to put the bytes in — say so rather than recording a
      // document row that points at nothing.
      if (!p.url) throw new Error("R2 belum dikonfigurasi — upload tidak tersedia");
      const put = await fetch(p.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Upload gagal (${put.status})`);

      // 3. record the document row only after the bytes landed
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

      setMsg(`Terunggah: ${file.name}`);
      form.reset();
      r.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal mengunggah");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 bg-white border border-[var(--color-outline-variant)] rounded p-4">
      <div className="font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Unggah dokumen</div>
      <div>
        <label htmlFor="doc-file" className="text-xs font-semibold tracking-widest uppercase">File</label>
        <input id="doc-file" name="file" type="file" required accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,.csv" className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label htmlFor="doc-category" className="text-xs font-semibold tracking-widest uppercase">Kategori</label>
        <select id="doc-category" name="category" className="w-full border rounded px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <Button size="sm" disabled={busy}>{busy ? "Mengunggah..." : "Upload"}</Button>
      {msg ? <div className="text-xs text-[var(--color-on-surface-variant)]">{msg}</div> : null}
    </form>
  );
}
