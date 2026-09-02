import { getPermissionsForUser } from "@metland/auth";
import { Kanban, type KanbanTask } from "@/components/tasks/Kanban";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/turso";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const db = getDb();
  const session = await getSession();

  let tasks: KanbanTask[] = [];
  let perms: string[] = [];
  try {
    const [rs, p] = await Promise.all([
      db.execute(`SELECT t.id, t.title, t.status, t.priority, t.due_date,
                         u.name AS assignee_name, p.name AS project_name
                  FROM tasks t
                  LEFT JOIN projects p ON p.id = t.project_id
                  LEFT JOIN users u ON u.id = t.assignee_id
                  ORDER BY t.due_date IS NULL, t.due_date ASC
                  LIMIT 200`),
      session ? getPermissionsForUser(db as never, session.userId).catch(() => [] as string[]) : Promise.resolve([] as string[]),
    ]);
    tasks = rs.rows as unknown as KanbanTask[];
    perms = p;
  } catch {}

  const canEdit = perms.includes("*") || perms.includes("task.update");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Tasks</h1>
        <p className="text-sm text-[var(--color-on-surface-variant)]">Board semua proyek — {tasks.length} task</p>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          Belum ada task — buat lewat <code>POST /api/projects/:id/tasks</code>
        </p>
      ) : (
        <Kanban tasks={tasks} canEdit={canEdit} />
      )}
    </div>
  );
}
