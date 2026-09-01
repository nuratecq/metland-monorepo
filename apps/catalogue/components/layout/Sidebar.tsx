"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Package, Search, Sparkles, ShieldCheck } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contractors", label: "Contractors", icon: Building2 },
  { href: "/materials", label: "Materials", icon: Package },
  { href: "/search", label: "AI Search", icon: Search },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
];

const admin = [
  { href: "/admin/users", label: "Users" },
  { href: "/import", label: "Import Data" },
  { href: "/admin/audit", label: "Audit Logs" },
];

export function Sidebar({ user }: { user?: { name: string; role: string } }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));
  const initials = (user?.name ?? "AI")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="w-[244px] shrink-0 border-r border-[var(--color-outline-variant)] bg-white hidden md:flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-[var(--color-outline-variant)] font-bold tracking-tight" style={{ fontFamily: "var(--font-hanken)" }}>
        METLAND Catalogue
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 h-[38px] px-3 rounded text-sm ${
                active
                  ? "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-semibold"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
              }`}
            >
              <n.icon size={16} className="shrink-0" />
              {n.label}
            </Link>
          );
        })}
        <div className="pt-4 mt-4 border-t border-[var(--color-outline-variant)]">
          <div className="px-3 text-xs font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">Administration</div>
          {admin.map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center gap-2.5 h-[38px] px-3 rounded text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]">
              <ShieldCheck size={16} />
              {a.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="p-3 border-t border-[var(--color-outline-variant)] flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[13px] font-semibold flex-none">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[var(--color-on-surface)] overflow-hidden text-ellipsis whitespace-nowrap">{user?.name ?? "Pengguna"}</div>
          <div className="text-xs text-[var(--color-outline)]">{user?.role ?? "Procurement"}</div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
