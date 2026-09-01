import Link from "next/link";
import { LayoutDashboard, FolderKanban, FolderHeart, Archive, CheckSquare, CalendarDays, Files, BarChart3, Bell, ShieldCheck } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "All Projects", icon: FolderKanban },
  { href: "/projects/my", label: "My Projects", icon: FolderHeart },
  { href: "/projects/archive", label: "Project Archive", icon: Archive },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/documents", label: "Documents", icon: Files },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-[var(--color-outline-variant)] bg-white hidden md:flex flex-col">
      <div className="h-14 flex items-center px-4 border-b font-bold tracking-tight" style={{ fontFamily: "var(--font-hanken)" }}>
        METLAND PM
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm">
            <n.icon size={16} className="shrink-0" />
            {n.label}
          </Link>
        ))}
        <div className="pt-4 mt-4 border-t">
          <div className="px-3 text-xs font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">Administration</div>
          <Link href="/admin/users" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm"><ShieldCheck size={16} />Users</Link>
          <Link href="/admin/roles" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm"><ShieldCheck size={16} />Roles & Permissions</Link>
          <Link href="/admin/audit" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm"><ShieldCheck size={16} />Audit Logs</Link>
        </div>
      </nav>
    </aside>
  );
}
