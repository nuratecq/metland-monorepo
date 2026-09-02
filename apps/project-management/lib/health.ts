import { getDb } from "@/lib/turso";

export type Health = "GREEN" | "YELLOW" | "RED";

// GREEN on track, YELLOW at risk, RED delayed
export async function computeProjectHealth(projectId: string): Promise<{ health: Health; progress: number }> {
  const db = getDb();
  // progress = avg milestone completion or task progress
  const ms = await db.execute({ sql: "SELECT AVG(completion_percentage) as avg FROM milestones WHERE project_id = ?", args: [projectId] }).catch(() => ({ rows: [{ avg: null }] } as never));
  const avgMs = Number((ms.rows[0] as unknown as Record<string, unknown>).avg ?? NaN);
  const ts = await db.execute({ sql: "SELECT AVG(progress) as avg FROM tasks WHERE project_id = ?", args: [projectId] }).catch(() => ({ rows: [{ avg: null }] } as never));
  const avgTs = Number((ts.rows[0] as unknown as Record<string, unknown>).avg ?? NaN);
  let progress = 0;
  if (!isNaN(avgMs) && !isNaN(avgTs)) progress = Math.round((avgMs + avgTs) / 2);
  else if (!isNaN(avgMs)) progress = Math.round(avgMs);
  else if (!isNaN(avgTs)) progress = Math.round(avgTs);
  else {
    const p = await db.execute({ sql: "SELECT progress FROM projects WHERE id = ?", args: [projectId] }).then(r => Number((r.rows[0] as unknown as Record<string, unknown>)?.progress ?? 0)).catch(() => 0);
    progress = p;
  }

  // health: RED if any milestone overdue & not DONE, else YELLOW if due in 7 days & <100%, else GREEN
  const overdue = await db
    .execute({ sql: "SELECT COUNT(*) as cnt FROM milestones WHERE project_id = ? AND due_date < date('now') AND status != 'DONE' AND completion_percentage < 100", args: [projectId] })
    .then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt))
    .catch(() => 0);
  if (overdue > 0) return { health: "RED", progress };
  const atRisk = await db
    .execute({ sql: "SELECT COUNT(*) as cnt FROM milestones WHERE project_id = ? AND due_date BETWEEN date('now') AND date('now','+7 days') AND completion_percentage < 80", args: [projectId] })
    .then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt))
    .catch(() => 0);
  if (atRisk > 0) return { health: "YELLOW", progress };

  const overdueTasks = await db
    .execute({ sql: "SELECT COUNT(*) as cnt FROM tasks WHERE project_id = ? AND due_date < date('now') AND status NOT IN ('DONE','CANCELLED')", args: [projectId] })
    .then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt))
    .catch(() => 0);
  if (overdueTasks > 2) return { health: "RED", progress };
  if (overdueTasks > 0) return { health: "YELLOW", progress };

  return { health: "GREEN", progress };
}

export async function syncProjectHealth(projectId: string) {
  const { health, progress } = await computeProjectHealth(projectId);
  const db = getDb();
  await db.execute({ sql: "UPDATE projects SET health_status = ?, progress = ?, updated_at = ? WHERE id = ?", args: [health, progress, new Date().toISOString(), projectId] });
  return { health, progress };
}
