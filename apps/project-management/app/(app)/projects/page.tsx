import { getDb } from "@/lib/turso";
import { Badge } from "@metland/ui";
import { Card, CardContent } from "@metland/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getProjects() {
  try {
    const db = getDb();
    const rs = await db.execute("SELECT * FROM projects ORDER BY created_at DESC LIMIT 50");
    return rs.rows as unknown as { id: string; project_code: string; name: string; status: string; health_status: string; progress: number }[];
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Projects</h1>
        <Link href="/projects/new" className="bg-[var(--color-primary)] text-white px-4 py-2 rounded text-sm">New Project</Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link href="/projects" className="px-3 py-1 bg-white border rounded">All</Link>
        <Link href="/projects?status=ACTIVE" className="px-3 py-1 bg-white border rounded">Active</Link>
        <Link href="/projects?status=COMPLETED" className="px-3 py-1 bg-white border rounded">Completed</Link>
      </div>

      {projects.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[var(--color-on-surface-variant)]">No projects yet — create via API <code>POST /api/projects</code> or use “New Project”.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="hover:border-[var(--color-primary)] transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs text-[var(--color-data-mono)]">{p.project_code}</div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-[var(--color-on-surface-variant)] flex gap-2 mt-1">
                      <Badge status={p.health_status === "RED" ? "critical" : p.health_status === "YELLOW" ? "warning" : "success"}>{p.health_status}</Badge>
                      <span>{p.status}</span>
                      <span>{p.progress}%</span>
                    </div>
                  </div>
                  <span className="text-sm text-[var(--color-primary)]">View →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
