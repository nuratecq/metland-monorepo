"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function InlineCreate({ projectId }: { projectId: string }) {
  const r = useRouter();
  const [tab, setTab] = useState<"milestone" | "task">("milestone");
  const [msg, setMsg] = useState<string | null>(null);

  async function submitMilestone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = { name: String(fd.get("name") ?? ""), due_date: String(fd.get("due_date") ?? "") || undefined, completion_percentage: Number(fd.get("completion_percentage") ?? 0) };
    const res = await fetch(`/api/projects/${projectId}/milestones`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json();
    if (!res.ok) setMsg(JSON.stringify(j.error ?? j)); else { setMsg("Milestone created"); r.refresh(); }
  }
  async function submitTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = { title: String(fd.get("title") ?? ""), priority: String(fd.get("priority") ?? "MEDIUM"), due_date: String(fd.get("due_date") ?? "") || undefined };
    const res = await fetch(`/api/projects/${projectId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json();
    if (!res.ok) setMsg(JSON.stringify(j.error ?? j)); else { setMsg("Task created"); r.refresh(); }
  }

  return (
    <div className="bg-white border border-[var(--color-outline-variant)] rounded p-4 space-y-3">
      <div className="font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Tambah milestone / task</div>
      <div className="flex gap-2">
        <button onClick={() => setTab("milestone")} className={`px-3 py-1 rounded text-sm border ${tab === "milestone" ? "bg-[var(--color-primary)] text-white" : "bg-white"}`}>Milestone</button>
        <button onClick={() => setTab("task")} className={`px-3 py-1 rounded text-sm border ${tab === "task" ? "bg-[var(--color-primary)] text-white" : "bg-white"}`}>Task</button>
      </div>
      {tab === "milestone" ? (
        <form onSubmit={submitMilestone} className="space-y-2">
          <input name="name" required placeholder="Foundation" className="w-full border rounded px-3 py-2 text-sm" />
          <input name="due_date" type="date" className="w-full border rounded px-3 py-2 text-sm" />
          <input name="completion_percentage" type="number" min={0} max={100} defaultValue={0} className="w-full border rounded px-3 py-2 text-sm" />
          <button className="bg-[var(--color-primary)] text-white px-3 py-1.5 rounded text-sm">Add Milestone</button>
        </form>
      ) : (
        <form onSubmit={submitTask} className="space-y-2">
          <input name="title" required placeholder="Task title" className="w-full border rounded px-3 py-2 text-sm" />
          <select name="priority" className="w-full border rounded px-3 py-2 text-sm"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select>
          <input name="due_date" type="date" className="w-full border rounded px-3 py-2 text-sm" />
          <button className="bg-[var(--color-primary)] text-white px-3 py-1.5 rounded text-sm">Add Task</button>
        </form>
      )}
      {msg ? <div className="text-xs">{msg}</div> : null}
    </div>
  );
}
