import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader, Badge } from "@metland/ui";
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const db = getDb();
  let tasks: unknown[] = [];
  try {
    const rs = await db.execute("SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON p.id=t.project_id ORDER BY t.due_date ASC LIMIT 50");
    tasks = rs.rows;
  } catch {}
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Tasks — All</h1>
      <Card><CardHeader className="font-semibold">Overdue / All Tasks</CardHeader><CardContent className="space-y-2">
        {tasks.length === 0 ? <span className="text-sm text-[var(--color-on-surface-variant)]">No tasks — create via <code>POST /api/projects/:id/tasks</code></span> : tasks.map((r: unknown) => {
          const t = r as Record<string, unknown>;
          return <div key={String(t.id)} className="flex items-center justify-between border rounded p-2 text-sm"><span>{String(t.title)} <span className="text-xs text-[var(--color-on-surface-variant)]">({String(t.project_name)})</span></span><Badge status={t.status === "DONE" ? "success" : t.status === "BLOCKED" ? "critical" : "neutral"}>{String(t.status)}</Badge></div>;
        })}
      </CardContent></Card>
    </div>
  );
}
