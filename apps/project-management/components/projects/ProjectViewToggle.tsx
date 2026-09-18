"use client";

import { useState, useEffect } from "react";
import { LayoutList, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Table, Th, Td } from "@metland/ui";
import { HEALTH_STYLE, PROJECT_STATUS_LABEL } from "@/lib/status-styles";

export type ProjectRow = {
  id: string;
  project_code: string;
  name: string;
  location_text: string | null;
  progress: number;
  status: string;
  health_status: string;
  planned_end_date: string | null;
  manager_name: string | null;
};

function ListView({ rows }: { rows: ProjectRow[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>ID</Th>
          <Th>Proyek</Th>
          <Th>Lokasi</Th>
          <Th>Progres</Th>
          <Th>Status</Th>
          <Th>PM</Th>
          <Th>Tenggat</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <Td colSpan={7} className="text-center py-10 text-[var(--color-on-surface-variant)]">
              Tidak ada proyek yang cocok.
            </Td>
          </tr>
        ) : (
          rows.map((p) => {
            const h = HEALTH_STYLE[p.health_status] ?? HEALTH_STYLE.GREEN;
            return (
              <tr key={p.id} className="hover:bg-[var(--color-surface-container-low)] cursor-pointer">
                <Td>
                  <Link href={`/projects/${p.id}`} className="font-mono text-[13px] text-[var(--color-data-mono)]">
                    {p.project_code}
                  </Link>
                </Td>
                <Td>
                  <Link href={`/projects/${p.id}`} className="font-medium text-[var(--color-on-surface)]">
                    {p.name}
                  </Link>
                </Td>
                <Td className="text-[var(--color-on-surface-variant)]">{p.location_text ?? "—"}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden min-w-[64px]">
                      <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: h.color }} />
                    </div>
                    <span className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{p.progress}%</span>
                  </div>
                </Td>
                <Td>
                  <span
                    className="h-[22px] px-2 inline-flex items-center rounded text-xs font-semibold tracking-wide uppercase"
                    style={{ background: h.bg, color: h.color }}
                  >
                    {PROJECT_STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </Td>
                <Td className="text-[var(--color-on-surface-variant)]">{p.manager_name ?? "—"}</Td>
                <Td className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{p.planned_end_date ?? "—"}</Td>
              </tr>
            );
          })
        )}
      </tbody>
    </Table>
  );
}

function GridView({ rows }: { rows: ProjectRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-[var(--color-on-surface-variant)] px-4">
        Tidak ada proyek yang cocok.
      </div>
    );
  }
  return (
    <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((p) => {
        const h = HEALTH_STYLE[p.health_status] ?? HEALTH_STYLE.GREEN;
        return (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="block rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-surface-container-low)] transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-[var(--color-outline)] mb-0.5">{p.project_code}</div>
                <div className="font-semibold text-[14px] text-[var(--color-on-surface)] leading-snug line-clamp-2">
                  {p.name}
                </div>
              </div>
              <span
                className="shrink-0 h-[20px] px-2 inline-flex items-center rounded text-[10px] font-semibold tracking-wide uppercase"
                style={{ background: h.bg, color: h.color }}
              >
                {h.label}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[var(--color-outline)]">Progress</span>
                <span className="font-mono text-[11px] text-[var(--color-outline)]">{p.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: h.color }} />
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between text-[11px] text-[var(--color-outline)]">
              <span>{p.manager_name ?? "—"}</span>
              {p.planned_end_date && (
                <span className="font-mono">{p.planned_end_date}</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function ProjectViewToggle({ rows }: { rows: ProjectRow[] }) {
  const [view, setView] = useState<"list" | "grid">("list");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("project-view") as "list" | "grid" | null;
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  const toggle = () => {
    const next = view === "list" ? "grid" : "list";
    setView(next);
    localStorage.setItem("project-view", next);
  };

  const isGrid = mounted && view === "grid";

  return (
    <div>
      <div className="flex items-center justify-end px-4 py-2 border-b border-[var(--color-outline-variant)]">
        <button
          onClick={toggle}
          title={isGrid ? "Switch to list view" : "Switch to grid view"}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] transition-colors"
        >
          {isGrid ? <LayoutList size={16} /> : <LayoutGrid size={16} />}
        </button>
      </div>
      {isGrid ? <GridView rows={rows} /> : <ListView rows={rows} />}
    </div>
  );
}
