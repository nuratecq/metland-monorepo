import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/turso";
import { AiAssistant } from "@/components/ai/AiAssistant";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const session = await getSession();
  const db = getDb();

  const [projectStats, taskStats] = await Promise.all([
    db
      .execute(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN health_status='GREEN' THEN 1 ELSE 0 END) as on_track,
                SUM(CASE WHEN health_status='YELLOW' THEN 1 ELSE 0 END) as at_risk,
                SUM(CASE WHEN health_status='RED' THEN 1 ELSE 0 END) as delayed
         FROM projects`
      )
      .catch(() => ({ rows: [{}] })),
    db
      .execute(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status='TODO' THEN 1 ELSE 0 END) as todo,
                SUM(CASE WHEN status='IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status='DONE' THEN 1 ELSE 0 END) as done,
                SUM(CASE WHEN due_date < date('now') AND status NOT IN ('DONE','CANCELLED') THEN 1 ELSE 0 END) as overdue
         FROM tasks`
      )
      .catch(() => ({ rows: [{}] })),
  ]);

  const initialStats = {
    projects: projectStats.rows[0] as Record<string, number>,
    tasks: taskStats.rows[0] as Record<string, number>,
  };

  return <AiAssistant initialStats={initialStats} userName={session?.name} />;
}
