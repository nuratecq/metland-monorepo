import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader } from "@metland/ui";
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const db = getDb();
  let notes: unknown[] = [];
  try { const rs = await db.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30"); notes = rs.rows; } catch {}
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Notifications</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">In-app MVP — Task/Milestone/Approval events</p>
      <Card><CardHeader className="font-semibold">Inbox</CardHeader><CardContent className="space-y-2">
        {notes.length===0 ? <span className="text-sm text-[var(--color-on-surface-variant)]">No notifications yet</span> : notes.map((r:unknown)=>{
          const n=r as Record<string,unknown>;
          return <div key={String(n.id)} className={`border rounded p-3 text-sm ${Number(n.is_read)===0 ? "bg-[var(--color-surface-container-low)]" : ""}`}><div className="font-medium">{String(n.title)} <span className="text-xs text-[var(--color-on-surface-variant)]">{String(n.type)}</span></div><div className="text-xs">{String(n.body ?? "")}</div><div className="text-xs text-[var(--color-data-mono)]">{String(n.created_at)}</div></div>;
        })}
      </CardContent></Card>
    </div>
  );
}
