import * as React from "react";

type Status = "success" | "warning" | "critical" | "info" | "neutral" | "draft";

const map: Record<Status, string> = {
  success: "bg-[#dcfce7] text-[#166534] border-[#86efac]", // green
  warning: "bg-[#fef3c7] text-[#92400e] border-[#fcd34d]", // yellow
  critical: "bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]", // red
  info: "bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]", // blue
  neutral: "bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]",
  draft: "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] border-[var(--color-outline-variant)]",
};

export function Badge({
  status = "neutral",
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { status?: Status }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-xs font-semibold tracking-widest uppercase rounded-[var(--radius)] ${map[status]} ${className}`}
      {...props}
    />
  );
}

export function HealthBadge({ health }: { health: "GREEN" | "YELLOW" | "RED" }) {
  const s = health === "GREEN" ? "success" : health === "YELLOW" ? "warning" : "critical";
  const label = health === "GREEN" ? "On Track" : health === "YELLOW" ? "At Risk" : "Delayed";
  return <Badge status={s}>{label}</Badge>;
}
