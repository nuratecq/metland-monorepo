"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkAllButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true, user_id: userId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="h-8 px-3 text-[13px] font-medium rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors disabled:opacity-50 cursor-pointer"
    >
      {loading ? "Menandai..." : "Mark all as Read"}
    </button>
  );
}
