"use client";

import { useRouter } from "next/navigation";

const CHIPS = [
  { value: "", label: "Semua" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "DONE", label: "Done" },
];

export function TaskFilters({ projectId, active }: { projectId: string; active: string }) {
  const router = useRouter();
  return (
    <div className="flex gap-1.5 flex-wrap">
      {CHIPS.map((c) => {
        const isActive = active === c.value;
        return (
          <button
            key={c.value || "all"}
            onClick={() => router.push(c.value ? `/projects/${projectId}?taskStatus=${c.value}` : `/projects/${projectId}`)}
            className={`h-[30px] px-3 rounded text-[13px] font-semibold border ${
              isActive
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-white text-[var(--color-on-surface-variant)] border-[var(--color-outline-variant)]"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
