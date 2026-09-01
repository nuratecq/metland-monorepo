"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_CHIPS = [
  { value: "", label: "Semua" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

const SORTS = [
  { value: "progress", label: "Urut: progres tertinggi" },
  { value: "deadline", label: "Urut: tenggat terdekat" },
  { value: "nama", label: "Urut: nama A–Z" },
];

export function ProjectFilters({ q, status, sort }: { q: string; status: string; sort: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(q);

  function navigate(next: { q?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams();
    const nq = next.q ?? q;
    const nstatus = next.status ?? status;
    const nsort = next.sort ?? sort;
    if (nq) params.set("q", nq);
    if (nstatus) params.set("status", nstatus);
    if (nsort) params.set("sort", nsort);
    router.push(`/projects${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="px-4 py-3.5 flex items-center gap-3 border-b border-[var(--color-outline-variant)] flex-wrap">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ q: search });
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari proyek, ID, atau lokasi…"
          className="w-[300px] h-9 px-3 border border-[#cbd5e1] rounded text-sm focus:outline-none focus:border-[var(--color-primary)]"
        />
      </form>
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_CHIPS.map((c) => {
          const active = status === c.value;
          return (
            <button
              key={c.value || "all"}
              onClick={() => navigate({ status: c.value })}
              className={`h-9 px-3.5 rounded text-[13px] font-semibold border ${
                active
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "bg-white text-[var(--color-on-surface-variant)] border-[var(--color-outline-variant)]"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <select
        value={sort}
        onChange={(e) => navigate({ sort: e.target.value })}
        className="h-9 px-2.5 border border-[#cbd5e1] rounded bg-white text-sm cursor-pointer"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
