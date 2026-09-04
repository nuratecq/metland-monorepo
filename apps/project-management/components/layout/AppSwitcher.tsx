"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSwitcher() {
  const pathname = usePathname();
  const isAi = pathname.startsWith("/ai");

  const apps = [
    { name: "Project Management", href: "/dashboard", active: !isAi },
    { name: "AI Assistant", href: "/ai", active: isAi },
  ];

  return (
    <div className="flex gap-0 p-1 bg-[var(--color-surface-container)] rounded-lg">
      {apps.map((a) => (
        <Link
          key={a.name}
          href={a.href}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            a.active
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-on-surface-variant,#6b7280)] hover:text-[var(--color-on-surface,#111)]"
          }`}
        >
          {a.name}
        </Link>
      ))}
    </div>
  );
}
