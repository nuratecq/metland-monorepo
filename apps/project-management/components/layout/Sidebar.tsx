"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, FolderHeart, Archive, CalendarDays, Files, BarChart3, Bell, ShieldCheck, Bot } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "All Projects", icon: FolderKanban },
  { href: "/projects/my", label: "My Projects", icon: FolderHeart },
  { href: "/projects/archive", label: "Project Archive", icon: Archive },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/documents", label: "Documents", icon: Files },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/ai", label: "AI Assistant", icon: Bot },
];

// Hiding a link is cosmetic — each page calls requirePagePerm() for the real
// check. This just avoids showing links that would bounce back to /dashboard.
const admin = [
  { href: "/admin/users", label: "Users", perm: "user.manage" },
  { href: "/admin/roles", label: "Roles", perm: "user.manage" },
  { href: "/admin/audit", label: "Audit Trail", perm: "audit.read" },
];

function reportPeriod() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(first)} – ${fmt(last)}`;
}

export function Sidebar({ user, perms = [] }: { user?: { name: string; role: string }; perms?: string[] }) {
  const pathname = usePathname();
  const visibleAdmin = admin.filter((a) => perms.includes("*") || perms.includes(a.perm));
  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    // All Projects: hanya exact /projects
    if (href === "/projects") return pathname === "/projects";
    // My Projects: juga aktif saat di project detail (/projects/[uuid] dan sub-routes)
    if (href === "/projects/my") {
      if (pathname.startsWith("/projects/my")) return true;
      if (["/projects/archive", "/projects/new"].some((s) => pathname.startsWith(s))) return false;
      return pathname.startsWith("/projects/");
    }
    return pathname.startsWith(href);
  };
  const initials = (user?.name ?? "PM")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="w-[244px] shrink-0 border-r border-[var(--color-outline-variant)] bg-white hidden md:flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-[var(--color-outline-variant)] font-bold tracking-tight" style={{ fontFamily: "var(--font-hanken)" }}>
        <Image src="/logo.png" alt="Metland" width={104} height={18} priority className="h-[18px] w-auto" />
        <span className="text-sm text-[var(--color-on-surface-variant)]">PM</span>
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
        <div className={`pt-4 mt-4 border-t border-[var(--color-outline-variant)] ${visibleAdmin.length ? "" : "hidden"}`}>
          <div className="px-3 text-xs font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">Administration</div>
          {visibleAdmin.map((a) => {
            const active = isActive(a.href);
            return (
              <Link
                key={a.href}
                href={a.href}
                className={`flex items-center gap-2.5 h-[38px] px-3 rounded text-sm ${
                  active
                    ? "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-semibold"
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
                }`}
              >
                <ShieldCheck size={16} />
                {a.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="m-3 p-3.5 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]">
        <div className="text-xs font-semibold tracking-widest uppercase text-[var(--color-outline)]">Periode laporan</div>
        <div className="mt-1.5 font-mono text-[13px] text-[var(--color-on-surface)]">{reportPeriod()}</div>
      </div>
      <div className="p-3 border-t border-[var(--color-outline-variant)] flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[13px] font-semibold flex-none">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[var(--color-on-surface)] overflow-hidden text-ellipsis whitespace-nowrap">{user?.name ?? "Pengguna"}</div>
          <div className="text-xs text-[var(--color-outline)]">{user?.role ?? "Project Manager"}</div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
