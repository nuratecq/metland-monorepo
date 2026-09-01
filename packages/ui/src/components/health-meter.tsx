export function HealthMeter({ value, health }: { value: number; health?: "GREEN" | "YELLOW" | "RED" }) {
  const color =
    health === "RED" ? "bg-[var(--color-status-red)]" : health === "YELLOW" ? "bg-[var(--color-status-yellow)]" : "bg-[var(--color-primary)]";
  return (
    <div className="h-2 w-full rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
