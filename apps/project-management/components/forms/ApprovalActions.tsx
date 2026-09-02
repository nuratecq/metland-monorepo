"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@metland/ui";

const DONE = new Set(["APPROVED", "REJECTED"]);

export function ApprovalActions({ approvalId, status }: { approvalId: string; status: string }) {
  const r = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function decide(decision: "APPROVED" | "REJECTED") {
    setBusy(decision);
    setErr(null);
    // approver_id is not sent — the API takes it from the session.
    const res = await fetch(`/api/approvals/${approvalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(typeof j.error === "string" ? j.error : "Gagal menyimpan keputusan");
      return;
    }
    r.refresh();
  }

  if (DONE.has(status)) return null;

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={busy !== null} onClick={() => decide("APPROVED")}>
        {busy === "APPROVED" ? "..." : "Approve"}
      </Button>
      <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => decide("REJECTED")}>
        {busy === "REJECTED" ? "..." : "Reject"}
      </Button>
      {err ? <span className="text-xs text-[#991b1b]">{err}</span> : null}
    </div>
  );
}
