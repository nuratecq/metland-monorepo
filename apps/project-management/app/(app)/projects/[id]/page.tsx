import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader, Badge, HealthMeter } from "@metland/ui";
import { FieldUpdateForm } from "@/components/forms/FieldUpdateForm";
import { InlineCreate } from "@/components/forms/InlineCreate";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  let project: Record<string, unknown> | null = null;
  try {
    const rs = await db.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [id] });
    project = rs.rows[0] as unknown as Record<string, unknown>;
  } catch {}
  if (!project) return notFound();

  const milestones = await db.execute({ sql: "SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC", args: [id] }).catch(() => ({ rows: [] } as never));
  const tasks = await db.execute({ sql: "SELECT * FROM tasks WHERE project_id = ? ORDER BY due_date ASC LIMIT 20", args: [id] }).catch(() => ({ rows: [] } as never));
  const issues = await db.execute({ sql: "SELECT * FROM issues WHERE project_id = ? ORDER BY created_at DESC LIMIT 10", args: [id] }).catch(() => ({ rows: [] } as never));

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs text-[var(--color-data-mono)]">{String(project.project_code)}</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>{String(project.name)}</h1>
        <div className="flex gap-2 mt-2">
          <Badge status={project.health_status === "RED" ? "critical" : project.health_status === "YELLOW" ? "warning" : "success"}>{String(project.health_status)}</Badge>
          <Badge status="neutral">{String(project.status)}</Badge>
          <span className="text-sm">{String(project.progress)}% progress</span>
        </div>
        <HealthMeter value={Number(project.progress)} health={project.health_status as never} />
        {project.description ? <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">{String(project.description)}</p> : null}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="font-semibold">Milestones — {milestones.rows.length}</CardHeader>
          <CardContent className="space-y-2 text-sm">
            {milestones.rows.length === 0 ? <span className="text-[var(--color-on-surface-variant)]">No milestones</span> : milestones.rows.map((m: unknown) => {
              const mm = m as Record<string, unknown>;
              return <div key={String(mm.id)} className="border rounded p-2"><div className="font-medium">{String(mm.name)}</div><div className="text-xs">{String(mm.status)} • {String(mm.completion_percentage)}%</div></div>;
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="font-semibold">Tasks — {tasks.rows.length}</CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tasks.rows.length === 0 ? <span className="text-[var(--color-on-surface-variant)]">No tasks</span> : tasks.rows.map((t: unknown) => {
              const tt = t as Record<string, unknown>;
              return <div key={String(tt.id)} className="border rounded p-2"><div className="font-medium">{String(tt.title)}</div><div className="text-xs">{String(tt.status)} • {String(tt.priority)}</div></div>;
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="font-semibold">Issues — {issues.rows.length}</CardHeader>
          <CardContent className="space-y-2 text-sm">
            {issues.rows.length === 0 ? <span className="text-[var(--color-on-surface-variant)]">No issues</span> : issues.rows.map((iss: unknown) => {
              const ii = iss as Record<string, unknown>;
              return <div key={String(ii.id)} className="border rounded p-2"><div className="font-medium">{String(ii.title)}</div><div className="text-xs">{String(ii.severity)} • {String(ii.status)}</div></div>;
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <InlineCreate projectId={id} />
        <FieldUpdateForm projectId={id} />
      </div>
    </div>
  );
}
