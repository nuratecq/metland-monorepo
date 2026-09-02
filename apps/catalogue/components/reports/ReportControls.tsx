"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@metland/ui";

/** Period filter + export bar. Print uses the browser dialog (Save as PDF) — no PDF dependency. */
export function ReportControls({ projects, exportPath }: {
  projects?: { id: string; name: string }[];
  exportPath: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`?${next.toString()}`);
  };

  const download = (format: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("format", format);
    window.open(`${exportPath}?${next.toString()}`, "_blank");
  };

  const field = "h-9 rounded border border-[var(--color-outline-variant)] bg-white px-2 text-sm";

  return (
    <div className="flex flex-wrap items-end gap-3 print:hidden">
      {projects && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-on-surface-variant)]">Project</span>
          <select className={field} value={params.get("project_id") ?? ""} onChange={(e) => set("project_id", e.target.value)}>
            <option value="">Dashboard (semua project)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--color-on-surface-variant)]">Dari</span>
        <input type="date" className={field} value={params.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--color-on-surface-variant)]">Sampai</span>
        <input type="date" className={field} value={params.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} />
      </label>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => window.print()}>PDF</Button>
        <Button size="sm" variant="secondary" onClick={() => download("xlsx")}>Excel</Button>
        <Button size="sm" variant="secondary" onClick={() => download("csv")}>CSV</Button>
      </div>
    </div>
  );
}
