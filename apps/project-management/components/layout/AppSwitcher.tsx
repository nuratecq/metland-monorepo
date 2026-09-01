"use client";
import Link from "next/link";

export function AppSwitcher() {
  const apps = [
    { name: "Project Management", href: process.env.NEXT_PUBLIC_PM_URL ?? "http://localhost:3000", current: true },
    { name: "AI Catalogue", href: process.env.NEXT_PUBLIC_CATALOGUE_URL ?? "http://localhost:3001", current: false },
  ];
  return (
    <div className="flex gap-1 p-1 bg-[var(--color-surface-container)] rounded">
      {apps.map(a=>(
        <Link key={a.name} href={a.href} className={`px-3 py-1 text-xs rounded ${a.current ? "bg-[var(--color-primary)] text-white" : "hover:bg-white"}`}>{a.name}</Link>
      ))}
    </div>
  );
}
