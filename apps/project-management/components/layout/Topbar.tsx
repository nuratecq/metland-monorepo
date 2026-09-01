import Link from "next/link";
import { AppSwitcher } from "./AppSwitcher";
import { Bell, ShieldCheck, BarChart3 } from "lucide-react";

export function Topbar({ user }: { user?: { name: string } }) {
  const initials = (user?.name ?? "PM")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="h-16 border-b border-[var(--color-outline-variant)] bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="text-sm text-[var(--color-on-surface-variant)]">Project Management — Operational</div>
        <AppSwitcher />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-[26px] px-2.5 flex items-center rounded bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-xs font-semibold tracking-wide">
          SINKRON BARU SAJA
        </div>
        <Link href="/notifications" className="p-1.5 rounded hover:bg-[var(--color-surface-container)]"><Bell size={18} /></Link>
        <Link href="/approvals" className="flex items-center gap-1 text-sm border border-[var(--color-outline-variant)] rounded px-2 py-0.5"><ShieldCheck size={14} />Approvals</Link>
        <Link href="/reports" className="flex items-center gap-1 text-sm border border-[var(--color-outline-variant)] rounded px-2 py-0.5"><BarChart3 size={14} />Reports</Link>
        <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] text-white grid place-items-center text-sm">{initials}</div>
      </div>
    </header>
  );
}
