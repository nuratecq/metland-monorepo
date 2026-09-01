import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader, HealthMeter } from "@metland/ui";
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const db = getDb();
  let milestones: unknown[] = [];
  try {
    const rs = await db.execute("SELECT m.*, p.name as project_name FROM milestones m JOIN projects p ON p.id=m.project_id ORDER BY m.due_date ASC LIMIT 50");
    milestones = rs.rows;
  } catch {}
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Schedule</h1>
      <Card><CardHeader className="font-semibold">Milestones Timeline</CardHeader><CardContent className="space-y-3">
        {milestones.length === 0 ? <span className="text-sm text-[var(--color-on-surface-variant)]">No milestones — create via <code>POST /api/projects/:id/milestones</code></span> : milestones.map((r: unknown) => {
          const m = r as Record<string, unknown>;
          return <div key={String(m.id)} className="border rounded p-3"><div className="flex justify-between text-sm"><span className="font-medium">{String(m.name)}</span><span className="text-xs">{String(m.project_name)}</span></div><HealthMeter value={Number(m.completion_percentage)} /><div className="text-xs text-[var(--color-on-surface-variant)]">Due: {String(m.due_date ?? "-")} • {String(m.status)}</div></div>;
        })}
      </CardContent></Card>
    </div>
  );
}
