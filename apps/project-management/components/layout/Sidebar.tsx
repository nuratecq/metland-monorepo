"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, FolderHeart, Archive,
  CalendarDays, Files, BarChart3, Bell, ShieldCheck, Bot,
  Users, Shield, Activity,
} from "lucide-react";
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

const admin = [
  { href: "/admin/users", label: "Users", perm: "user.manage", icon: Users },
  { href: "/admin/roles", label: "Roles", perm: "user.manage", icon: Shield },
  { href: "/admin/audit", label: "Audit Trail", perm: "audit.read", icon: Activity },
];

function reportPeriod() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  return `${fmt(first)} – ${fmt(last)}`;
}

export function Sidebar({ user, perms = [] }: { user?: { name: string; role: string }; perms?: string[] }) {
  const pathname = usePathname();
  const visibleAdmin = admin.filter((a) => perms.includes("*") || perms.includes(a.perm));

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/projects") return pathname === "/projects";
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
    <aside className="w-[248px] shrink-0 bg-[var(--color-surface-container-low)] hidden md:flex flex-col m-2 rounded-xl overflow-hidden">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center gap-2.5 px-4">
        <Image src="/logo.png" alt="Metland" width={96} height={16} priority className="h-[16px] w-auto" />
        <span className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-high)] px-1.5 py-0.5 rounded-sm tracking-wide">
          PM
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pt-4 pb-2 space-y-px overflow-y-auto">
        {nav.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 h-9 px-2.5 rounded-md text-sm transition-colors duration-150 ${
                active
                  ? "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-medium"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]"
              }`}
            >
              <n.icon size={15} className="shrink-0 opacity-75" />
              {n.label}
            </Link>
          );
        })}

        {visibleAdmin.length > 0 && (
          <div className="pt-3 mt-2 border-t border-[var(--color-outline-variant)]">
            <div className="px-2.5 pb-1.5 text-[11px] font-medium text-[var(--color-outline)] tracking-wide">
              Administration
            </div>
            {visibleAdmin.map((a) => {
              const active = isActive(a.href);
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`flex items-center gap-2.5 h-9 px-2.5 rounded-md text-sm transition-colors duration-150 ${
                    active
                      ? "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-medium"
                      : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]"
                  }`}
                >
                  <a.icon size={15} className="shrink-0 opacity-75" />
                  {a.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Report period */}
      <div className="px-3.5 py-2 border-t border-[var(--color-outline-variant)]">
        <p className="text-[11px] text-[var(--color-outline)]">
          <span className="font-medium text-[var(--color-on-surface-variant)]">Periode</span>{" "}
          {reportPeriod()}
        </p>
      </div>

      {/* User */}
      <div className="px-3 py-2.5 border-t border-[var(--color-outline-variant)] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[11px] font-semibold flex-none select-none">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-[var(--color-on-surface)] truncate leading-snug">
            {user?.name ?? "Pengguna"}
          </div>
          <div className="text-[11px] text-[var(--color-outline)] leading-snug">
            {user?.role ?? "Project Manager"}
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
