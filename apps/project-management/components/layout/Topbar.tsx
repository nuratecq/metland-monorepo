import Link from "next/link";
export function Topbar() {
  return (
    <header className="h-14 border-b border-[var(--color-outline-variant)] bg-white flex items-center justify-between px-4">
      <div className="text-sm text-[var(--color-on-surface-variant)]">Project Management — Operational</div>
      <div className="flex items-center gap-3">
        <Link href="/notifications" className="text-sm">🔔</Link>
        <Link href="/approvals" className="text-sm border rounded px-2 py-0.5">Approvals</Link>
        <Link href="/reports" className="text-sm border rounded px-2 py-0.5">Reports</Link>
        <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] text-white grid place-items-center text-sm">PM</div>
      </div>
    </header>
  );
}
