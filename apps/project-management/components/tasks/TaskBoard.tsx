"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Search, Filter, ArrowUpDown, List as ListIcon,
  Columns2, CalendarDays, RefreshCw, MoreHorizontal, CheckSquare, AlertCircle,
  ArrowUp, ArrowDown, Minus, X, Check,
} from "lucide-react";
import { Kanban, type KanbanTask } from "./Kanban";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  assignee_id: string | null;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
};

type UserOption = { id: string; name: string };
type Project = { id: string; name: string; project_code: string };

type Props = {
  project: Project;
  initialTasks: TaskItem[];
  users: UserOption[];
  canEdit: boolean;
  canCreate: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { value: "TODO", label: "To Do", bg: "#f1f5f9", color: "#475569" },
  { value: "IN_PROGRESS", label: "In Progress", bg: "#dbeafe", color: "#1e40af" },
  { value: "BLOCKED", label: "Blocked", bg: "#fee2e2", color: "#991b1b" },
  { value: "DONE", label: "Done", bg: "#dcfce7", color: "#166534" },
  { value: "CANCELLED", label: "Cancelled", bg: "#f1f5f9", color: "#64748b" },
];

const PRIORITY_OPTS = [
  { value: "CRITICAL", label: "Critical", color: "#991b1b" },
  { value: "HIGH", label: "High", color: "#92400e" },
  { value: "MEDIUM", label: "Medium", color: "#b45309" },
  { value: "LOW", label: "Low", color: "#64748b" },
];

const SORT_OPTS = [
  { value: "created_at_desc", label: "Terbaru dibuat" },
  { value: "created_at_asc", label: "Terlama dibuat" },
  { value: "due_date_asc", label: "Jatuh tempo terdekat" },
  { value: "due_date_desc", label: "Jatuh tempo terjauh" },
  { value: "priority_desc", label: "Prioritas tertinggi" },
  { value: "status_asc", label: "Status A→Z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

function getStatus(v: string) { return STATUS_OPTS.find((s) => s.value === v) ?? STATUS_OPTS[0]; }
function getPriority(v: string) { return PRIORITY_OPTS.find((p) => p.value === v) ?? PRIORITY_OPTS[2]; }

function priorityWeight(p: string) { return ({ CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as Record<string, number>)[p] ?? 2; }

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(due: string | null, status: string) {
  return !!due && status !== "DONE" && status !== "CANCELLED" && due < TODAY;
}

function shortId(id: string) { return id.slice(0, 8).toUpperCase(); }

function initials(name: string | null) {
  return (name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Shared Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = getStatus(status);
  return (
    <span
      className="inline-flex items-center h-[20px] px-2 rounded text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function PriorityChip({ priority }: { priority: string }) {
  const p = getPriority(priority);
  const Icon = priority === "CRITICAL" ? AlertCircle : priority === "HIGH" ? ArrowUp : priority === "LOW" ? ArrowDown : Minus;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium leading-none" style={{ color: p.color }}>
      <Icon size={11} />
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

function Avatar({ name, size = 22 }: { name: string | null; size?: number }) {
  return (
    <div
      className="rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name ?? "Unassigned"}
    >
      {initials(name)}
    </div>
  );
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

function Dropdown({
  trigger,
  children,
  keepOpen = false,
  align = "left",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  keepOpen?: boolean;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-50 top-full ${align === "right" ? "right-0" : "left-0"} mt-1 min-w-[160px] bg-white border border-[var(--color-outline-variant)] rounded-lg shadow-[0_4px_20px_rgba(23,29,28,0.12)] py-1`}
          onClick={keepOpen ? undefined : () => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkBar({
  count,
  onBulkStatus,
  onDeselect,
}: {
  count: number;
  onBulkStatus: (status: string) => void;
  onDeselect: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] rounded-xl shadow-[0_8px_32px_rgba(23,29,28,0.22)]">
      <span className="text-[13px] font-semibold">{count} task dipilih</span>
      <span className="w-px h-4 bg-[var(--color-outline)]" />
      <Dropdown
        align="left"
        trigger={
          <button className="text-[13px] font-medium flex items-center gap-1 opacity-90 hover:opacity-100">
            Ubah status ▾
          </button>
        }
      >
        {STATUS_OPTS.map((s) => (
          <button
            key={s.value}
            onClick={() => onBulkStatus(s.value)}
            className="w-full px-3 py-1.5 text-[13px] text-left text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </Dropdown>
      <button
        onClick={onDeselect}
        className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

function CreateModal({
  projectId,
  users,
  onClose,
  onCreated,
}: {
  projectId: string;
  users: UserOption[];
  onClose: () => void;
  onCreated: (task: TaskItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("TODO");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Judul task wajib diisi"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || undefined,
          priority, status,
          assignee_id: assigneeId || undefined,
          start_date: startDate || undefined,
          due_date: dueDate || undefined,
          progress: 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat task");
      const now = new Date().toISOString();
      onCreated({
        ...json.data,
        assignee_name: users.find((u) => u.id === assigneeId)?.name ?? null,
        created_at: json.data.created_at ?? now,
        updated_at: json.data.updated_at ?? now,
        start_date: (json.data.start_date ?? startDate) || null,
        due_date: (json.data.due_date ?? dueDate) || null,
        progress: 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = "w-full h-9 px-3 rounded border border-[var(--color-outline-variant)] text-sm bg-white focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]";
  const labelClass = "block text-[12px] font-semibold text-[var(--color-on-surface-variant)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-[0_8px_40px_rgba(23,29,28,0.15)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-outline-variant)] sticky top-0 bg-white">
          <h2 className="text-[15px] font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Buat Task Baru</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
          )}
          <div>
            <label className={labelClass}>Judul *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deskripsi singkat task..." className={fieldClass} autoFocus />
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detail task (opsional)..." className="w-full px-3 py-2 rounded border border-[var(--color-outline-variant)] text-sm bg-white focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
                {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Prioritas</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={fieldClass}>
                {PRIORITY_OPTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Penanggung jawab</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={fieldClass}>
              <option value="">— Tidak ditugaskan</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tanggal mulai</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Jatuh tempo</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldClass} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-8 px-4 rounded border border-[var(--color-outline-variant)] text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]">
              Batal
            </button>
            <button type="submit" disabled={loading} className="h-8 px-4 rounded bg-[var(--color-primary)] text-white text-[13px] font-semibold hover:bg-[var(--color-primary-container)] disabled:opacity-50">
              {loading ? "Menyimpan..." : "Buat Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Detail Drawer ───────────────────────────────────────────────────────

function DetailDrawer({
  task,
  project,
  onClose,
  onStatusChange,
  onPriorityChange,
}: {
  task: TaskItem;
  project: Project;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-[420px] bg-white border-l border-[var(--color-outline-variant)] shadow-[-4px_0_24px_rgba(23,29,28,0.10)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--color-outline-variant)] shrink-0">
          <span className="font-mono text-[11px] text-[var(--color-data-mono)] bg-[var(--color-surface-container-low)] px-2 py-0.5 rounded">{shortId(task.id)}</span>
          <div className="flex-1" />
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <h2 className="text-[17px] font-semibold leading-snug" style={{ fontFamily: "var(--font-hanken)" }}>{task.title}</h2>

          {/* Status + Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <Dropdown trigger={<button className="cursor-pointer hover:opacity-80 transition-opacity"><StatusBadge status={task.status} /></button>}>
              {STATUS_OPTS.map((s) => (
                <button key={s.value} onClick={() => onStatusChange(task.id, s.value)} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left hover:bg-[var(--color-surface-container-low)] ${task.status === s.value ? "font-semibold text-[var(--color-primary)]" : "text-[var(--color-on-surface)]"}`}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  {s.label}
                  {task.status === s.value && <Check size={11} className="ml-auto text-[var(--color-primary)]" />}
                </button>
              ))}
            </Dropdown>
            <Dropdown trigger={
              <button className="h-[26px] px-2.5 rounded border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] flex items-center cursor-pointer">
                <PriorityChip priority={task.priority} />
              </button>
            }>
              {PRIORITY_OPTS.map((p) => (
                <button key={p.value} onClick={() => onPriorityChange(task.id, p.value)} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left hover:bg-[var(--color-surface-container-low)]`} style={{ color: p.color }}>
                  {p.label}
                  {task.priority === p.value && <Check size={11} className="ml-auto" />}
                </button>
              ))}
            </Dropdown>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold tracking-wide uppercase text-[var(--color-outline)]">Progress</span>
              <span className="font-mono text-[12px] text-[var(--color-data-mono)]">{task.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${task.progress}%`,
                  background: task.status === "DONE" ? "#166534" : "var(--color-primary)",
                }}
              />
            </div>
          </div>

          {/* Metadata table */}
          <div className="rounded-lg border border-[var(--color-outline-variant)] divide-y divide-[var(--color-surface-container-high)] text-[13px]">
            {[
              ["Proyek", project.name],
              ["Assignee", task.assignee_name ?? "—"],
              ["Mulai", fmtDate(task.start_date)],
              ["Jatuh tempo", fmtDate(task.due_date)],
              ["Dibuat", new Date(task.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })],
              ["Diperbarui", new Date(task.updated_at).toLocaleDateString("id-ID", { dateStyle: "medium" })],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-4 px-4 py-2.5">
                <span className="w-24 shrink-0 text-[var(--color-outline)]">{k}</span>
                <span className="font-medium text-[var(--color-on-surface)] truncate">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Gantt / Timeline View ────────────────────────────────────────────────────

const LABEL_W = 220;
const DAY_W = 30;
const ROW_H = 36;

function GanttView({
  tasks,
  onTaskClick,
}: {
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem) => void;
}) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const withDates = tasks.filter((t) => t.start_date || t.due_date);
  const noDates = tasks.filter((t) => !t.start_date && !t.due_date);

  if (withDates.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-outline-variant)] bg-white text-center py-12 px-5">
        <CalendarDays size={32} className="mx-auto text-[var(--color-outline-variant)] mb-3" />
        <p className="text-[14px] font-semibold text-[var(--color-on-surface)]">Belum ada task dengan tanggal</p>
        <p className="mt-1 text-[13px] text-[var(--color-on-surface-variant)]">Set start date / due date pada task untuk menampilkan timeline.</p>
      </div>
    );
  }

  // Date range
  const allDates: string[] = [TODAY];
  withDates.forEach((t) => {
    if (t.start_date) allDates.push(t.start_date);
    if (t.due_date) allDates.push(t.due_date);
  });
  const minStr = allDates.reduce((a, b) => (a < b ? a : b));
  const maxStr = allDates.reduce((a, b) => (a > b ? a : b));

  const rangeStart = new Date(minStr);
  rangeStart.setDate(rangeStart.getDate() - 7);
  rangeStart.setDate(rangeStart.getDate() - ((rangeStart.getDay() + 6) % 7));

  const rangeEnd = new Date(maxStr);
  rangeEnd.setDate(rangeEnd.getDate() + 14);
  rangeEnd.setDate(rangeEnd.getDate() + (7 - rangeEnd.getDay()) % 7);

  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1;

  function dayCol(dateStr: string): number {
    return Math.floor((new Date(dateStr).getTime() - rangeStart.getTime()) / 86400000);
  }

  const days: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const months: { label: string; count: number }[] = [];
  days.forEach((d) => {
    const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const last = months[months.length - 1];
    if (last && last.label === label) last.count++;
    else months.push({ label, count: 1 });
  });

  const todayCol = dayCol(TODAY);
  const totalChartW = totalDays * DAY_W;
  const HEADER_H = 52; // 28 + 24
  const SECTION_H = 33;

  function onRightScroll() {
    if (syncing.current || !leftRef.current || !rightRef.current) return;
    syncing.current = true;
    leftRef.current.scrollTop = rightRef.current.scrollTop;
    syncing.current = false;
  }

  function onLeftScroll() {
    if (syncing.current || !leftRef.current || !rightRef.current) return;
    syncing.current = true;
    rightRef.current.scrollTop = leftRef.current.scrollTop;
    syncing.current = false;
  }

  return (
    // overflow-hidden clips horizontal overflow — card is the scroll boundary
    <div
      className="rounded-lg border border-[var(--color-outline-variant)] bg-white overflow-hidden flex"
      style={{ maxHeight: "72vh" }}
    >
      {/* LEFT PANEL: frozen label column, vertical scroll synced with right */}
      <div
        ref={leftRef}
        onScroll={onLeftScroll}
        className="flex-shrink-0 border-r border-[var(--color-outline-variant)] [&::-webkit-scrollbar]:hidden"
        style={{ width: LABEL_W, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}
      >
        {/* Sticky "Task" header — sticks inside this panel's scroll container */}
        <div
          className="sticky top-0 z-20 bg-[var(--color-surface-container-low)] border-b-2 border-[var(--color-outline-variant)] flex items-end px-3 pb-2"
          style={{ height: HEADER_H }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-outline)]">Task</span>
        </div>

        {/* Task label rows */}
        {withDates.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 px-3 border-b border-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-low)] cursor-pointer transition-colors"
            style={{ height: ROW_H }}
            onClick={() => onTaskClick(task)}
          >
            <span className="font-mono text-[10px] text-[var(--color-data-mono)] shrink-0 bg-[var(--color-surface-container)] px-1 rounded">
              {shortId(task.id)}
            </span>
            <span className="text-[12px] font-medium text-[var(--color-on-surface)] truncate" title={task.title}>
              {task.title}
            </span>
          </div>
        ))}

        {/* No-dates section */}
        {noDates.length > 0 && (
          <>
            <div
              className="sticky px-3 border-t-2 border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex items-center"
              style={{ top: HEADER_H, height: SECTION_H }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-outline)]">
                Tanpa Tanggal ({noDates.length})
              </span>
            </div>
            {noDates.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 px-3 border-b border-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-low)] cursor-pointer transition-colors"
                style={{ height: ROW_H }}
                onClick={() => onTaskClick(task)}
              >
                <span className="font-mono text-[10px] text-[var(--color-data-mono)] shrink-0">{shortId(task.id)}</span>
                <span className="text-[12px] text-[var(--color-on-surface-variant)] truncate">{task.title}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* RIGHT PANEL: chart — horizontal + vertical scroll, both contained in card */}
      <div
        ref={rightRef}
        onScroll={onRightScroll}
        style={{ flex: 1, overflow: "auto", minWidth: 0 }}
      >
        <div style={{ width: totalChartW, minWidth: totalChartW }}>

          {/* Month header — sticky within right panel's scroll container */}
          <div
            className="sticky top-0 z-20 flex border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]"
            style={{ height: 28 }}
          >
            {months.map((m, i) => (
              <div
                key={i}
                className="flex items-center px-2 border-r border-[var(--color-outline-variant)]"
                style={{ width: m.count * DAY_W, minWidth: m.count * DAY_W, height: 28 }}
              >
                <span className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] truncate">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Day header — sticky */}
          <div
            className="sticky top-[28px] z-20 flex border-b-2 border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]"
            style={{ height: 24 }}
          >
            {days.map((d, i) => {
              const dStr = d.toISOString().slice(0, 10);
              const isToday = dStr === TODAY;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              const isMonday = d.getDay() === 1;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-center text-[10px] border-r ${isMonday ? "border-[var(--color-outline-variant)]" : "border-[var(--color-surface-container-high)]"}`}
                  style={{
                    width: DAY_W, minWidth: DAY_W, height: 24,
                    background: isToday ? "var(--color-secondary-container)" : undefined,
                    color: isToday ? "var(--color-primary)" : isWeekend ? "var(--color-outline-variant)" : "var(--color-outline)",
                    fontWeight: isToday ? 700 : undefined,
                  }}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>

          {/* Task bar rows */}
          {withDates.map((task) => {
            const startCol = task.start_date ? dayCol(task.start_date) : (task.due_date ? dayCol(task.due_date) : 0);
            const endCol = task.due_date ? dayCol(task.due_date) : startCol;
            const barW = Math.max((endCol - startCol + 1) * DAY_W, DAY_W);
            const barL = startCol * DAY_W;
            const s = getStatus(task.status);
            const overdue = isOverdue(task.due_date, task.status);
            return (
              <div
                key={task.id}
                className="relative border-b border-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-low)] transition-colors"
                style={{ height: ROW_H }}
              >
                {days.map((d, i) =>
                  (d.getDay() === 0 || d.getDay() === 6) ? (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: i * DAY_W, width: DAY_W, background: "var(--color-surface-container-low)" }}
                    />
                  ) : null
                )}
                {todayCol >= 0 && todayCol < totalDays && (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-10"
                    style={{ left: todayCol * DAY_W + DAY_W / 2, width: 2, background: "var(--color-primary)", opacity: 0.5 }}
                  />
                )}
                <div
                  className="absolute rounded cursor-pointer hover:brightness-95 transition-all flex items-center px-2 overflow-hidden z-20"
                  style={{
                    top: 5, bottom: 5,
                    left: barL, width: barW,
                    background: s.bg,
                    border: `1.5px solid ${s.color}44`,
                  }}
                  onClick={() => onTaskClick(task)}
                  title={`${task.title}\n${fmtDate(task.start_date)} → ${fmtDate(task.due_date)}`}
                >
                  {barW > 56 && (
                    <span className="text-[11px] font-semibold truncate" style={{ color: s.color }}>{task.title}</span>
                  )}
                </div>
                {overdue && (
                  <div
                    className="absolute rounded-r z-30 pointer-events-none"
                    style={{ top: 5, bottom: 5, left: barL + barW, width: 4, background: "var(--color-error)" }}
                  />
                )}
              </div>
            );
          })}

          {/* No-dates placeholder rows */}
          {noDates.length > 0 && (
            <>
              <div
                className="border-t-2 border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]"
                style={{ height: SECTION_H }}
              />
              {noDates.map((task) => (
                <div
                  key={task.id}
                  className="relative border-b border-[var(--color-surface-container-high)]"
                  style={{ height: ROW_H }}
                >
                  {days.map((d, i) =>
                    (d.getDay() === 0 || d.getDay() === 6) ? (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{ left: i * DAY_W, width: DAY_W, background: "var(--color-surface-container-low)" }}
                      />
                    ) : null
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function TaskBoard({ project, initialTasks, users, canEdit, canCreate }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [view, setView] = useState<"list" | "board" | "timeline">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [sort, setSort] = useState("created_at_desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = tasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        shortId(t.id).toLowerCase().includes(q) ||
        (t.assignee_name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (statusFilter.length) list = list.filter((t) => statusFilter.includes(t.status));
    if (priorityFilter.length) list = list.filter((t) => priorityFilter.includes(t.priority));
    return [...list].sort((a, b) => {
      switch (sort) {
        case "created_at_desc": return b.created_at.localeCompare(a.created_at);
        case "created_at_asc": return a.created_at.localeCompare(b.created_at);
        case "due_date_asc": return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
        case "due_date_desc": return (b.due_date ?? "0000").localeCompare(a.due_date ?? "0000");
        case "priority_desc": return priorityWeight(b.priority) - priorityWeight(a.priority);
        case "status_asc": return a.status.localeCompare(b.status);
        default: return 0;
      }
    });
  }, [tasks, search, statusFilter, priorityFilter, sort]);

  // Optimistic update helpers
  async function changeStatus(id: string, status: string) {
    const prev = tasks.find((t) => t.id === id)?.status;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    setDetailTask((d) => (d?.id === id ? { ...d, status } : d));
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok && prev) {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: prev } : t)));
      setDetailTask((d) => (d?.id === id ? { ...d, status: prev } : d));
    }
  }

  async function changePriority(id: string, priority: string) {
    const prev = tasks.find((t) => t.id === id)?.priority;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, priority } : t)));
    setDetailTask((d) => (d?.id === id ? { ...d, priority } : d));
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    if (!res.ok && prev) {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, priority: prev } : t)));
      setDetailTask((d) => (d?.id === id ? { ...d, priority: prev } : d));
    }
  }

  async function bulkStatus(status: string) {
    const ids = [...selected];
    setTasks((ts) => ts.map((t) => (selected.has(t.id) ? { ...t, status } : t)));
    setSelected(new Set());
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      )
    );
  }

  function toggleRow(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleAll() {
    setSelected(selected.size === filtered.length && filtered.length > 0 ? new Set() : new Set(filtered.map((t) => t.id)));
  }

  const activeFilters = statusFilter.length + priorityFilter.length;
  const kanbanTasks: KanbanTask[] = tasks.map((t) => ({
    id: t.id, title: t.title, status: t.status, priority: t.priority,
    due_date: t.due_date, assignee_name: t.assignee_name, project_name: project.name,
  }));

  const btnBase = "h-8 px-3 flex items-center gap-1.5 rounded border text-[13px] font-medium transition-colors cursor-pointer";
  const btnNeutral = `${btnBase} border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] bg-white hover:bg-[var(--color-surface-container-low)]`;
  const btnActive = `${btnBase} border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-secondary-container)]`;
  const btnView = (active: boolean) =>
    `px-3 flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
      active
        ? "bg-[var(--color-secondary-container)] text-[var(--color-primary)]"
        : "bg-white text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
    }`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
        >
          <ArrowLeft size={13} />
          {project.project_code} · {project.name}
        </Link>
        <h1 className="mt-1.5 text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>
          Task Management
        </h1>
        <p className="mt-0.5 text-[14px] text-[var(--color-on-surface-variant)]">
          Plan, organize, and track project tasks and progress.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="h-8 w-52 pl-8 pr-3 rounded border border-[var(--color-outline-variant)] text-[13px] bg-white focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)]">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter */}
        <Dropdown
          keepOpen
          trigger={
            <button className={activeFilters ? btnActive : btnNeutral}>
              <Filter size={13} />
              Filter{activeFilters ? ` (${activeFilters})` : ""}
            </button>
          }
        >
          <div className="px-3 py-2.5 w-52">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] mb-2">Status</p>
            <div className="space-y-0.5">
              {STATUS_OPTS.map((s) => (
                <label key={s.value} className="flex items-center gap-2 py-1 cursor-pointer text-[13px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
                  <input type="checkbox" checked={statusFilter.includes(s.value)} onChange={(e) => setStatusFilter((prev) => e.target.checked ? [...prev, s.value] : prev.filter((v) => v !== s.value))} className="accent-[var(--color-primary)]" />
                  {s.label}
                </label>
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] mt-3 mb-2">Prioritas</p>
            <div className="space-y-0.5">
              {PRIORITY_OPTS.map((p) => (
                <label key={p.value} className="flex items-center gap-2 py-1 cursor-pointer text-[13px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
                  <input type="checkbox" checked={priorityFilter.includes(p.value)} onChange={(e) => setPriorityFilter((prev) => e.target.checked ? [...prev, p.value] : prev.filter((v) => v !== p.value))} className="accent-[var(--color-primary)]" />
                  {p.label}
                </label>
              ))}
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setStatusFilter([]); setPriorityFilter([]); }} className="mt-3 text-[12px] text-[var(--color-error)] hover:underline">
                Reset filter
              </button>
            )}
          </div>
        </Dropdown>

        {/* Sort */}
        <Dropdown
          trigger={<button className={btnNeutral}><ArrowUpDown size={13} /> Sort</button>}
        >
          <div className="py-0.5 w-52">
            {SORT_OPTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`w-full text-left px-3 py-1.5 text-[13px] flex items-center justify-between hover:bg-[var(--color-surface-container-low)] ${sort === s.value ? "font-semibold text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}
              >
                {s.label}
                {sort === s.value && <Check size={11} />}
              </button>
            ))}
          </div>
        </Dropdown>

        {/* View switcher */}
        <div className="flex h-8 rounded border border-[var(--color-outline-variant)] overflow-hidden">
          <button onClick={() => setView("list")} className={btnView(view === "list")}>
            <ListIcon size={13} /> List
          </button>
          <button onClick={() => setView("board")} className={`${btnView(view === "board")} border-l border-[var(--color-outline-variant)]`}>
            <Columns2 size={13} /> Board
          </button>
          <button onClick={() => setView("timeline")} className={`${btnView(view === "timeline")} border-l border-[var(--color-outline-variant)]`}>
            <CalendarDays size={13} /> Timeline
          </button>
        </div>

        <div className="flex-1" />

        {/* Right actions */}
        <button
          onClick={() => window.location.reload()}
          className="h-8 w-8 flex items-center justify-center rounded border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
          title="Refresh"
        >
          <RefreshCw size={13} />
        </button>

        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="h-8 px-3 flex items-center gap-1.5 rounded bg-[var(--color-primary)] text-white text-[13px] font-semibold hover:bg-[var(--color-primary-container)] transition-colors"
          >
            <Plus size={14} /> Buat Task
          </button>
        )}
      </div>

      {/* Stats strip */}
      {view === "list" && filtered.length > 0 && (
        <div className="flex items-center gap-4 text-[12px] text-[var(--color-outline)] flex-wrap">
          <span>{filtered.length} task</span>
          {selected.size > 0 && <span className="text-[var(--color-primary)] font-semibold">{selected.size} dipilih</span>}
          {STATUS_OPTS
            .filter((s) => filtered.some((t) => t.status === s.value))
            .map((s) => (
              <span key={s.value} className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                {filtered.filter((t) => t.status === s.value).length} {s.label}
              </span>
            ))}
        </div>
      )}

      {/* Content */}
      {view === "timeline" ? (
        <GanttView tasks={filtered} onTaskClick={setDetailTask} />
      ) : view === "board" ? (
        <Kanban tasks={kanbanTasks} canEdit={canEdit} />
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="rounded-lg border border-[var(--color-outline-variant)] bg-white text-center py-16 px-5">
          <CheckSquare size={36} className="mx-auto text-[var(--color-outline-variant)] mb-3" />
          <p className="text-[15px] font-semibold text-[var(--color-on-surface)]">
            {tasks.length === 0 ? "Belum ada task" : "Tidak ada task yang cocok"}
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-on-surface-variant)]">
            {tasks.length === 0
              ? "Buat task pertama untuk mulai mengorganisir proyek."
              : "Coba ubah filter atau kata kunci pencarian."}
          </p>
          {tasks.length === 0 && canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-5 h-8 px-4 rounded bg-[var(--color-primary)] text-white text-[13px] font-semibold hover:bg-[var(--color-primary-container)]"
            >
              + Buat Task
            </button>
          )}
        </div>
      ) : (
        /* Task table */
        <div className="rounded-lg border border-[var(--color-outline-variant)] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]" style={{ minWidth: 860 }}>
              <thead>
                <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)]">
                  <th className="w-10 pl-3 py-2.5 sticky left-0 bg-[var(--color-surface-container-low)]">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      ref={(el) => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length; }}
                      onChange={toggleAll}
                      className="accent-[var(--color-primary)]"
                    />
                  </th>
                  {[
                    { label: "Task", cls: "text-left px-3 py-2.5 min-w-[240px]" },
                    { label: "Status", cls: "text-left px-3 py-2.5 w-32" },
                    { label: "Prioritas", cls: "text-left px-3 py-2.5 w-28" },
                    { label: "Mulai", cls: "text-left px-3 py-2.5 w-28 hidden lg:table-cell" },
                    { label: "Jatuh Tempo", cls: "text-left px-3 py-2.5 w-28" },
                    { label: "Assignee", cls: "text-left px-3 py-2.5 w-36 hidden md:table-cell" },
                    { label: "Progress", cls: "text-left px-3 py-2.5 w-28 hidden xl:table-cell" },
                  ].map(({ label, cls }) => (
                    <th key={label} className={`${cls} text-[10px] font-bold uppercase tracking-wider text-[var(--color-outline)]`}>
                      {label}
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const overdue = isOverdue(task.due_date, task.status);
                  const isSelected = selected.has(task.id);
                  return (
                    <tr
                      key={task.id}
                      className={`border-b border-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-low)] transition-colors group ${isSelected ? "bg-blue-50/40" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="pl-3 py-2 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(task.id)}
                          className="accent-[var(--color-primary)]"
                        />
                      </td>

                      {/* Task */}
                      <td className="px-3 py-2 align-middle">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckSquare size={13} className="text-[var(--color-outline)] shrink-0" />
                          <span className="font-mono text-[10px] text-[var(--color-data-mono)] shrink-0 bg-[var(--color-surface-container)] px-1.5 py-0.5 rounded">
                            {shortId(task.id)}
                          </span>
                          <button
                            onClick={() => setDetailTask(task)}
                            className="text-left font-medium text-[var(--color-on-surface)] hover:text-[var(--color-primary)] truncate max-w-[320px] cursor-pointer transition-colors"
                            title={task.title}
                          >
                            {task.title}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2 align-middle">
                        <Dropdown
                          trigger={
                            <button className="cursor-pointer hover:opacity-80 transition-opacity">
                              <StatusBadge status={task.status} />
                            </button>
                          }
                        >
                          {STATUS_OPTS.map((s) => (
                            <button
                              key={s.value}
                              onClick={() => changeStatus(task.id, s.value)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left hover:bg-[var(--color-surface-container-low)] ${task.status === s.value ? "font-semibold text-[var(--color-primary)]" : "text-[var(--color-on-surface)]"}`}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                              {s.label}
                              {task.status === s.value && <Check size={10} className="ml-auto text-[var(--color-primary)]" />}
                            </button>
                          ))}
                        </Dropdown>
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-2 align-middle">
                        <Dropdown
                          trigger={
                            <button className="cursor-pointer hover:opacity-80 transition-opacity">
                              <PriorityChip priority={task.priority} />
                            </button>
                          }
                        >
                          {PRIORITY_OPTS.map((p) => (
                            <button
                              key={p.value}
                              onClick={() => changePriority(task.id, p.value)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left hover:bg-[var(--color-surface-container-low)] ${task.priority === p.value ? "font-semibold" : ""}`}
                              style={{ color: p.color }}
                            >
                              {p.label}
                              {task.priority === p.value && <Check size={10} className="ml-auto" />}
                            </button>
                          ))}
                        </Dropdown>
                      </td>

                      {/* Start date */}
                      <td className="px-3 py-2 align-middle hidden lg:table-cell">
                        <span className="text-[var(--color-on-surface-variant)]">{fmtDate(task.start_date)}</span>
                      </td>

                      {/* Due date */}
                      <td className="px-3 py-2 align-middle">
                        <span
                          className={overdue ? "font-semibold" : ""}
                          style={{ color: overdue ? "var(--color-error)" : "var(--color-on-surface-variant)" }}
                        >
                          {fmtDate(task.due_date)}
                          {overdue && <span className="ml-1 text-[10px]">!</span>}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="px-3 py-2 align-middle hidden md:table-cell">
                        {task.assignee_name ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={task.assignee_name} size={20} />
                            <span className="text-[var(--color-on-surface-variant)] truncate max-w-[100px]">{task.assignee_name}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--color-outline)]">—</span>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="px-3 py-2 align-middle hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden min-w-[48px]">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${task.progress}%`,
                                background: task.status === "DONE" ? "#166534" : "var(--color-primary)",
                              }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[var(--color-data-mono)] w-6 text-right shrink-0">{task.progress}%</span>
                        </div>
                      </td>

                      {/* Row actions */}
                      <td className="pr-2 py-2 align-middle">
                        <Dropdown
                          align="right"
                          trigger={
                            <button className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] transition-all">
                              <MoreHorizontal size={14} />
                            </button>
                          }
                        >
                          <button onClick={() => setDetailTask(task)} className="w-full text-left px-3 py-1.5 text-[13px] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]">
                            Lihat detail
                          </button>
                          <button onClick={() => changeStatus(task.id, "IN_PROGRESS")} className="w-full text-left px-3 py-1.5 text-[13px] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]">
                            Mulai task
                          </button>
                          <button onClick={() => changeStatus(task.id, "DONE")} className="w-full text-left px-3 py-1.5 text-[13px] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]">
                            Tandai selesai
                          </button>
                          <div className="my-1 border-t border-[var(--color-surface-container-high)]" />
                          <button onClick={() => changeStatus(task.id, "CANCELLED")} className="w-full text-left px-3 py-1.5 text-[13px] text-[var(--color-error)] hover:bg-red-50">
                            Batalkan
                          </button>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <BulkBar count={selected.size} onBulkStatus={bulkStatus} onDeselect={() => setSelected(new Set())} />
      )}

      {/* Modals / drawers */}
      {showCreate && (
        <CreateModal
          projectId={project.id}
          users={users}
          onClose={() => setShowCreate(false)}
          onCreated={(task) => setTasks((prev) => [task, ...prev])}
        />
      )}
      {detailTask && (
        <DetailDrawer
          task={detailTask}
          project={project}
          onClose={() => setDetailTask(null)}
          onStatusChange={changeStatus}
          onPriorityChange={changePriority}
        />
      )}
    </div>
  );
}
