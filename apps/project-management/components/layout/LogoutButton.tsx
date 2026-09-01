"use client";

import { useRouter } from "next/navigation";
import { Power } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      title="Keluar"
      className="ml-auto w-[30px] h-[30px] flex-none flex items-center justify-center border border-[var(--color-outline-variant)] rounded bg-white text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
    >
      <Power size={14} />
    </button>
  );
}
