import Link from "next/link";
import { AppSwitcher } from "./AppSwitcher";
import { Bell } from "lucide-react";

export function Topbar({ user }: { user?: { name: string } }) {
  return (
    <header className="h-12 border-b border-[var(--color-outline-variant)] bg-white flex items-center justify-between px-5 shrink-0">
      <AppSwitcher />
      <div className="flex items-center gap-1.5">
        <Link
          href="/notifications"
          className="p-1.5 rounded-md text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)] transition-colors"
        >
          <Bell size={16} />
        </Link>
      </div>
    </header>
  );
}
