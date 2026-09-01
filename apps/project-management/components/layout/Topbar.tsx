export function Topbar() {
  return (
    <header className="h-14 border-b border-[var(--color-outline-variant)] bg-white flex items-center justify-between px-4">
      <div className="text-sm text-[var(--color-on-surface-variant)]">Project Management — Operational</div>
      <div className="flex items-center gap-3">
        <span className="text-sm">🔔</span>
        <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] text-white grid place-items-center text-sm">PM</div>
      </div>
    </header>
  );
}
