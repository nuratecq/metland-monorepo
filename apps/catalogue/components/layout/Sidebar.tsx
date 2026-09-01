import Link from "next/link";
import { LayoutDashboard, Building2, Package, Search, Sparkles, ShieldCheck, Files } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contractors", label: "Contractors", icon: Building2 },
  { href: "/materials", label: "Materials", icon: Package },
  { href: "/search", label: "AI Search", icon: Search },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/documents", label: "Documents", icon: Files },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-[var(--color-outline-variant)] bg-white hidden md:flex flex-col">
      <div className="h-14 flex items-center px-4 border-b font-bold tracking-tight" style={{ fontFamily: "var(--font-hanken)" }}>
        METLAND Catalogue
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
          <Link href="/admin/import" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm"><ShieldCheck size={16} />Import Data</Link>
          <Link href="/admin/audit" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm"><ShieldCheck size={16} />Audit Logs</Link>
        </div>
      </nav>
    </aside>
  );
}
