import { getDb } from "@/lib/turso";
import { getSession } from "@/lib/auth";
import { Bell, CheckSquare, Flag, ShieldCheck, MessageCircle, Bell as BellIcon } from "lucide-react";
import Link from "next/link";
import { MarkAllButton } from "./MarkAllButton";

export const dynamic = "force-dynamic";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: number;
  created_at: string;
};

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("task"))
    return <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0"><CheckSquare size={16} className="text-[#006767]" /></div>;
  if (t.includes("milestone"))
    return <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0"><Flag size={16} className="text-orange-500" /></div>;
  if (t.includes("approval"))
    return <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0"><ShieldCheck size={16} className="text-green-600" /></div>;
  if (t.includes("comment"))
    return <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><MessageCircle size={16} className="text-blue-500" /></div>;
  return <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><BellIcon size={16} className="text-gray-400" /></div>;
}

function entityLink(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "project") return `/projects/${entityId}`;
  if (entityType === "task") return `/tasks`;
  if (entityType === "approval") return `/approvals`;
  if (entityType === "milestone") return `/schedule`;
  return null;
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function dateLabel(d: string): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function groupByDate(notifs: Notif[]): { label: string; items: Notif[] }[] {
  const map = new Map<string, Notif[]>();
  for (const n of notifs) {
    const label = dateLabel(n.created_at);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(n);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export default async function NotificationsPage() {
  const db = getDb();
  const session = await getSession();
  const userId = session?.userId ?? "system";

  let notifs: Notif[] = [];
  try {
    const rs = await db.execute({
      sql: "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      args: [userId] as never[],
    });
    notifs = (rs.rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ""),
      type: String(r.type ?? "General"),
      title: String(r.title ?? ""),
      body: r.body != null ? String(r.body) : null,
      entity_type: r.entity_type != null ? String(r.entity_type) : null,
      entity_id: r.entity_id != null ? String(r.entity_id) : null,
      is_read: Number(r.is_read ?? 0),
      created_at: String(r.created_at ?? ""),
    }));
  } catch {}

  const unreadCount = notifs.filter((n) => n.is_read === 0).length;
  const groups = groupByDate(notifs);

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Notifications</h1>
          {unreadCount > 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              You have <span className="font-semibold text-[var(--color-on-surface)]">{unreadCount}</span> notification{unreadCount !== 1 ? "s" : ""} to go through
            </p>
          ) : (
            <p className="text-sm text-[var(--color-on-surface-variant)]">All caught up</p>
          )}
        </div>
        {notifs.length > 0 && <MarkAllButton userId={userId} />}
      </div>

      {/* Empty state */}
      {notifs.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm flex flex-col items-center justify-center py-20 text-[var(--color-on-surface-variant)]">
          <Bell size={36} className="opacity-25 mb-3" />
          <p className="text-sm font-medium">Belum ada notifikasi.</p>
        </div>
      )}

      {/* Grouped notification list */}
      {groups.map((group) => (
        <div key={group.label}>
          {/* Date group label */}
          <div className="text-[12px] font-medium text-[var(--color-on-surface-variant)] mb-2 px-1">
            {group.label}
          </div>

          {/* Notifications card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {group.items.map((n, idx) => {
              const link = entityLink(n.entity_type, n.entity_id);
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3.5 ${
                    idx < group.items.length - 1 ? "border-b border-[var(--color-outline-variant)]" : ""
                  } ${n.is_read === 0 ? "bg-[var(--color-surface-container-low)]" : ""}`}
                >
                  {/* Icon */}
                  {typeIcon(n.type)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-[var(--color-on-surface)]">{n.title}</span>
                      <span className="text-[11px] text-[var(--color-on-surface-variant)]">{timeAgo(n.created_at)}</span>
                      {n.is_read === 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0 self-center" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5 leading-snug">{n.body}</p>
                    )}
                  </div>

                  {/* View link */}
                  {link ? (
                    <Link
                      href={link}
                      className="text-[13px] font-medium text-[var(--color-primary)] hover:underline shrink-0 self-center"
                    >
                      View
                    </Link>
                  ) : (
                    <span className="w-[32px] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
