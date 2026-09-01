import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";

/** Reports docs/PRD.md:657 — Project Summary + Dashboard Report, export via JSON (PDF/Excel future) */
export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";
  const project_id = searchParams.get("project_id");

  if (project_id) {
    // Project Summary
    const p = await db.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [project_id] });
    if (!p.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const ms = await db.execute({ sql: "SELECT * FROM milestones WHERE project_id = ?", args: [project_id] });
    const ts = await db.execute({ sql: "SELECT status, COUNT(*) as cnt FROM tasks WHERE project_id = ? GROUP BY status", args: [project_id] });
    const iss = await db.execute({ sql: "SELECT status, COUNT(*) as cnt FROM issues WHERE project_id = ? GROUP BY status", args: [project_id] });
    const report = { project: p.rows[0], milestones: ms.rows, task_status: ts.rows, issue_status: iss.rows };
    if (format === "csv") {
      const csv = `Project,${(p.rows[0] as unknown as Record<string,string>).name}\nProgress,${(p.rows[0] as unknown as Record<string,number>).progress}\nStatus,${(p.rows[0] as unknown as Record<string,string>).status}\n`;
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="report-${project_id}.csv"` } });
    }
    return NextResponse.json({ data: report });
  }

  // Dashboard report
  const total = await db.execute("SELECT COUNT(*) as cnt FROM projects").then(r => Number((r.rows[0] as unknown as Record<string,number>).cnt));
  const byStatus = await db.execute("SELECT status, COUNT(*) as cnt FROM projects GROUP BY status");
  const byHealth = await db.execute("SELECT health_status, COUNT(*) as cnt FROM projects GROUP BY health_status");
  const overdueTasks = await db.execute("SELECT COUNT(*) as cnt FROM tasks WHERE due_date < date('now') AND status != 'DONE'").then(r => Number((r.rows[0] as unknown as Record<string,number>).cnt)).catch(() => 0);
  return NextResponse.json({ data: { total, byStatus: byStatus.rows, byHealth: byHealth.rows, overdueTasks } });
}
