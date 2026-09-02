"use client";

import { useOptimistic, useState, useTransition } from "react";

export type KanbanTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_name: string | null;
  project_name: string | null;
};

// CANCELLED is deliberately absent: five columns do not fit a laptop without
// horizontal scroll, and a cancelled task is not work in flight. The board
// counts them in the footer instead.
const COLUMNS = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "DONE", label: "Done" },
] as const;

const PRIORITY: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-slate-100 text-slate-700",
  LOW: "bg-slate-100 text-slate-500",
};

const overdue = (d: string | null, status: string) => !!d && status !== "DONE" && d < new Date().toISOString().slice(0, 10);

export function Kanban({ tasks: initial, canEdit }: { tasks: KanbanTask[]; canEdit: boolean }) {
  // Optimistic so a drop lands instantly; the server reply reconciles. A failed
  // PATCH rolls the card back on its own when the transition settles.
  const [tasks, setTasks] = useState(initial);
  const [optimistic, move] = useOptimistic(tasks, (state: KanbanTask[], m: { id: string; status: string }) =>
    state.map((t) => (t.id === m.id ? { ...t, status: m.status } : t))
  );
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function drop(status: string) {
    const id = dragId;
    setOver(null);
    setDragId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;

    setError(null);
    startTransition(async () => {
      move({ id, status });
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(res.status === 403 ? "Peran Anda tidak punya izin task.update." : String((j as { error?: string }).error ?? "Gagal memindahkan task"));
        return; // optimistic value is dropped when the transition ends
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    });
  }

  const cancelled = optimistic.filter((t) => t.status === "CANCELLED").length;

  return (
    <div className="space-y-3">
      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</div> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = optimistic.filter((t) => t.status === col.status);
          return (
            <section
              key={col.status}
              onDragOver={(e) => { if (canEdit && dragId) { e.preventDefault(); setOver(col.status); } }}
              onDragLeave={() => setOver((o) => (o === col.status ? null : o))}
              onDrop={(e) => { e.preventDefault(); drop(col.status); }}
              className={`rounded-lg border p-2.5 min-h-[160px] transition-colors ${
                over === col.status
                  ? "border-[var(--color-primary)] bg-[var(--color-secondary-container)]"
                  : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]"
              }`}
            >
              <header className="flex items-center justify-between px-1 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">{col.label}</span>
                <span className="text-xs text-[var(--color-outline)]">{items.length}</span>
              </header>

              <ul className="space-y-2">
                {items.map((t) => (
                  <li
                    key={t.id}
                    draggable={canEdit}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setOver(null); }}
                    className={`rounded border border-[var(--color-outline-variant)] bg-white p-2.5 text-sm ${
                      canEdit ? "cursor-grab active:cursor-grabbing" : ""
                    } ${dragId === t.id ? "opacity-40" : ""}`}
                  >
                    <div className="font-medium text-[var(--color-on-surface)]">{t.title}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className={`rounded px-1.5 py-0.5 font-medium ${PRIORITY[t.priority] ?? PRIORITY.MEDIUM}`}>{t.priority}</span>
                      {t.due_date ? (
                        <span className={overdue(t.due_date, t.status) ? "font-medium text-red-700" : "text-[var(--color-outline)]"}>
                          {t.due_date}
                        </span>
                      ) : null}
                      {t.assignee_name ? <span className="text-[var(--color-outline)]">· {t.assignee_name}</span> : null}
                    </div>
                    {t.project_name ? <div className="mt-1 text-xs text-[var(--color-outline)]">{t.project_name}</div> : null}
                  </li>
                ))}
                {items.length === 0 ? <li className="px-1 py-3 text-xs text-[var(--color-outline)]">Kosong</li> : null}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-outline)]">
        {canEdit ? "Tarik kartu antar kolom untuk mengubah status." : "Mode baca — butuh izin task.update untuk memindahkan kartu."}
        {cancelled ? ` · ${cancelled} task dibatalkan (tidak ditampilkan).` : ""}
      </p>
    </div>
  );
}
