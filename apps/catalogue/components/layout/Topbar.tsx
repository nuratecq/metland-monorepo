import { AppSwitcher } from "./AppSwitcher";
import { Bell } from "lucide-react";

export function Topbar({ user }: { user?: { name: string } }) {
  const initials = (user?.name ?? "AI")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="h-16 border-b border-[var(--color-outline-variant)] bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="text-sm text-[var(--color-on-surface-variant)]">AI Catalogue — Discovery</div>
        <AppSwitcher />
      </div>
      <div className="flex items-center gap-3">
        <Bell size={18} className="text-[var(--color-on-surface-variant)]" />
        <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] text-white grid place-items-center text-sm">{initials}</div>
      </div>
    </header>
  );
}
