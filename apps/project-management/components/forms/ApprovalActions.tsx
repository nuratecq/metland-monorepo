"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

const DONE = new Set(["APPROVED", "REJECTED"]);

export function ApprovalActions({ approvalId, status }: { approvalId: string; status: string }) {
  const r = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function decide(decision: "APPROVED" | "REJECTED") {
    setBusy(decision);
    setErr(null);
    const res = await fetch(`/api/approvals/${approvalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(typeof j.error === "string" ? j.error : "Gagal");
      return;
    }
    r.refresh();
  }

  if (DONE.has(status)) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => decide("APPROVED")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Check size={11} />
        {busy === "APPROVED" ? "..." : "Approve"}
      </button>
      <button
        onClick={() => decide("REJECTED")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <X size={11} />
        {busy === "REJECTED" ? "..." : "Reject"}
      </button>
      {err && <span className="text-[11px] text-red-600">{err}</span>}
    </div>
  );
}
