import Link from "next/link";
import { AppSwitcher } from "./AppSwitcher";
import { Bell, ShieldCheck, BarChart3 } from "lucide-react";
export function Topbar() {
  return (
    <header className="h-14 border-b border-[var(--color-outline-variant)] bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="text-sm text-[var(--color-on-surface-variant)]">Project Management — Operational</div>
        <AppSwitcher />
      </div>
      <div className="flex items-center gap-3">
        <Link href="/notifications" className="p-1.5 rounded hover:bg-[var(--color-surface-container)]"><Bell size={18} /></Link>
        <Link href="/approvals" className="flex items-center gap-1 text-sm border rounded px-2 py-0.5"><ShieldCheck size={14} />Approvals</Link>
        <Link href="/reports" className="flex items-center gap-1 text-sm border rounded px-2 py-0.5"><BarChart3 size={14} />Reports</Link>
        <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] text-white grid place-items-center text-sm">PM</div>
      </div>
    </header>
  );
}
