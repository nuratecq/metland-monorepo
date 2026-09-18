"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
type Tab = "milestone" | "task" | "issue";

const TABS: { id: Tab; label: string }[] = [
  { id: "milestone", label: "Milestone" },
  { id: "task",      label: "Task" },
  { id: "issue",     label: "Issue" },
];

const inputCls = "w-full h-9 px-3 bg-[var(--color-surface-container-low)] rounded-lg text-[13px] border border-transparent focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]";
const selectCls = `${inputCls} cursor-pointer`;
const labelCls = "block text-[12px] font-medium text-[var(--color-on-surface-variant)] mb-1.5";

export function InlineCreate({ projectId }: { projectId: string }) {
  const r = useRouter();
  const [tab, setTab] = useState<Tab>("milestone");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(url: string, body: Record<string, unknown>, label: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg({ type: "err", text: String(j.error ?? "Gagal") });
    } else {
      setMsg({ type: "ok", text: `${label} ditambahkan` });
      (e.target as HTMLFormElement).reset();
      r.refresh();
    }
  }

  function handleMilestone(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    submit(
      `/api/projects/${projectId}/milestones`,
      { name: String(fd.get("name") ?? ""), due_date: String(fd.get("due_date") ?? "") || undefined, completion_percentage: Number(fd.get("completion_percentage") ?? 0) },
      "Milestone", e
    );
  }
  function handleTask(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    submit(
      `/api/projects/${projectId}/tasks`,
      { title: String(fd.get("title") ?? ""), priority: String(fd.get("priority") ?? "MEDIUM"), due_date: String(fd.get("due_date") ?? "") || undefined },
      "Task", e
    );
  }
  function handleIssue(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    submit(
      `/api/projects/${projectId}/issues`,
      { title: String(fd.get("title") ?? ""), description: String(fd.get("description") ?? "") || undefined, severity: String(fd.get("severity") ?? "MEDIUM"), due_date: String(fd.get("due_date") ?? "") || undefined },
      "Issue", e
    );
  }

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div className="font-semibold text-[15px]" style={{ fontFamily: "var(--font-hanken)" }}>
        Tambah {activeTab.label}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-[var(--color-surface-container-low)] rounded-lg">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setMsg(null); }}
            className={`flex-1 h-7 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? "bg-white text-[var(--color-on-surface)] shadow-sm"
                : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Milestone form */}
      {tab === "milestone" && (
        <form onSubmit={handleMilestone} className="space-y-3">
          <div>
            <label className={labelCls}>Nama milestone</label>
            <input name="name" required placeholder="Foundation Phase" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Target selesai</label>
              <input name="due_date" type="date" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Progress (%)</label>
              <input name="completion_percentage" type="number" min={0} max={100} defaultValue={0} className={inputCls} />
            </div>
          </div>
          <SubmitButton loading={loading} label="Tambah Milestone" />
        </form>
      )}

      {/* Task form */}
      {tab === "task" && (
        <form onSubmit={handleTask} className="space-y-3">
          <div>
            <label className={labelCls}>Judul task</label>
            <input name="title" required placeholder="Install formwork sisi utara" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Prioritas</label>
              <select name="priority" className={selectCls}>
                <option value="LOW">Low</option>
                <option value="MEDIUM" selected>Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Due date</label>
              <input name="due_date" type="date" className={inputCls} />
            </div>
          </div>
          <SubmitButton loading={loading} label="Tambah Task" />
        </form>
      )}

      {/* Issue form */}
      {tab === "issue" && (
        <form onSubmit={handleIssue} className="space-y-3">
          <div>
            <label className={labelCls}>Judul issue</label>
            <input name="title" required placeholder="Retakan pondasi sisi barat" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Deskripsi (opsional)</label>
            <textarea name="description" rows={2} placeholder="Detail masalah..." className={`${inputCls} h-auto py-2 resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Severity</label>
              <select name="severity" className={selectCls}>
                <option value="LOW">Low</option>
                <option value="MEDIUM" selected>Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Due date</label>
              <input name="due_date" type="date" className={inputCls} />
            </div>
          </div>
          <SubmitButton loading={loading} label="Tambah Issue" />
        </form>
      )}

      {msg && (
        <div
          className="text-[12px] px-3 py-2 rounded-lg"
          style={{
            background: msg.type === "ok" ? "#f0fdf4" : "#fef2f2",
            color: msg.type === "ok" ? "#16a34a" : "#dc2626",
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      disabled={loading}
      className="w-full h-9 rounded-lg bg-[var(--color-primary)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
    >
      {loading ? "Menyimpan..." : label}
    </button>
  );
}
