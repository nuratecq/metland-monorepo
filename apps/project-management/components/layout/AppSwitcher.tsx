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
    <div className="flex gap-0 p-1 bg-[var(--color-surface-container-high)] rounded-md w-full">
      {apps.map((a) => (
        <Link
          key={a.name}
          href={a.href}
          className={`flex-1 text-center px-2 py-1.5 text-xs font-medium rounded-sm transition-colors ${
            a.active
              ? "bg-white text-[var(--color-on-surface)] shadow-sm"
              : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
          }`}
        >
          {a.name}
        </Link>
      ))}
    </div>
  );
}
