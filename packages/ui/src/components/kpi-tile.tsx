import * as React from "react";

export function KpiTile({
  label,
  value,
  sub,
  className = "",
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-4 ${className}`}>
      <div className="text-xs font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">{label}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-on-surface)]" style={{ fontFamily: "var(--font-hanken)" }}>
        {value}
      </div>
      {sub ? <div className="text-sm text-[var(--color-data-mono)]">{sub}</div> : null}
    </div>
  );
}
