"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Mirrors the server's transition map in app/api/documents/[id]/route.ts.
 * The server stays authoritative — this only decides which buttons to draw. */
const NEXT: Record<string, string[]> = {
  DRAFT: ["UNDER_REVIEW", "ARCHIVED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "ARCHIVED"],
  APPROVED: ["ARCHIVED"],
  REJECTED: ["UNDER_REVIEW", "ARCHIVED"],
  ARCHIVED: [],
};
const LABEL: Record<string, string> = {
  UNDER_REVIEW: "Review", APPROVED: "Approve", REJECTED: "Reject", ARCHIVED: "Arsipkan",
};

export function DocumentStatus({ documentId, status }: { documentId: string; status: string }) {
  const r = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const next = NEXT[status] ?? [];

  async function move(to: string) {
    setBusy(to);
    setErr(null);
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(typeof j.error === "string" ? j.error : "Gagal mengubah status");
      return;
    }
    r.refresh();
  }

  if (!next.length) return null;

  return (
    <span className="flex items-center gap-1.5">
      {next.map((s) => (
        <button
          key={s}
          disabled={busy !== null}
          onClick={() => move(s)}
          className="h-7 px-2 border border-[var(--color-outline-variant)] rounded text-xs font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50"
        >
          {busy === s ? "..." : LABEL[s] ?? s}
        </button>
      ))}
      {err ? <span className="text-xs text-[#991b1b]">{err}</span> : null}
    </span>
  );
}
