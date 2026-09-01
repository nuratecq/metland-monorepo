import Link from "next/link";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/contractors", label: "Contractors" },
  { href: "/materials", label: "Materials" },
  { href: "/search", label: "AI Search" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/approvals", label: "Approvals" },
  { href: "/documents", label: "Documents" },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-[var(--color-outline-variant)] bg-white hidden md:flex flex-col">
      <div className="h-14 flex items-center px-4 border-b font-bold tracking-tight" style={{ fontFamily: "var(--font-hanken)" }}>
        METLAND Catalogue
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="block px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm">
            {n.label}
          </Link>
        ))}
        <div className="pt-4 mt-4 border-t">
          <div className="px-3 text-xs font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">Administration</div>
          <Link href="/admin/users" className="block px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm">Users</Link>
          <Link href="/admin/import" className="block px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm">Import Data</Link>
          <Link href="/admin/audit" className="block px-3 py-2 rounded hover:bg-[var(--color-surface-container)] text-sm">Audit Logs</Link>
        </div>
      </nav>
    </aside>
  );
}
