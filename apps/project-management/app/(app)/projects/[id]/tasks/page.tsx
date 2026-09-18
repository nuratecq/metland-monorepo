import { getPermissionsForUser } from "@metland/auth";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/turso";
import { notFound } from "next/navigation";
import { TaskBoard, type TaskItem } from "@/components/tasks/TaskBoard";

export const dynamic = "force-dynamic";

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const session = await getSession();

  const [projectRs, tasksRs, usersRs, perms] = await Promise.all([
    db.execute({
      sql: "SELECT id, name, project_code FROM projects WHERE id = ?",
      args: [id],
    }).catch(() => ({ rows: [] as unknown[] })),

    db.execute({
      sql: `SELECT t.id, t.title, t.status, t.priority,
                   t.start_date, t.due_date, t.progress,
                   t.assignee_id, u.name AS assignee_name,
                   t.created_at, t.updated_at
            FROM tasks t
            LEFT JOIN users u ON u.id = t.assignee_id
            WHERE t.project_id = ?
            ORDER BY t.created_at DESC`,
      args: [id],
    }).catch(() => ({ rows: [] as unknown[] })),

    db.execute({
      sql: "SELECT id, name FROM users ORDER BY name",
    }).catch(() => ({ rows: [] as unknown[] })),

    session
      ? getPermissionsForUser(db as never, session.userId).catch(() => [] as string[])
      : Promise.resolve([] as string[]),
  ]);

  const rawProject = projectRs.rows[0] as Record<string, unknown> | undefined;
  if (!rawProject) return notFound();
  const project = { id: String(rawProject.id), name: String(rawProject.name), project_code: String(rawProject.project_code) };

  const tasks: TaskItem[] = (tasksRs.rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    status: String(r.status ?? "TODO"),
    priority: String(r.priority ?? "MEDIUM"),
    start_date: r.start_date != null ? String(r.start_date) : null,
    due_date: r.due_date != null ? String(r.due_date) : null,
    progress: Number(r.progress ?? 0),
    assignee_id: r.assignee_id != null ? String(r.assignee_id) : null,
    assignee_name: r.assignee_name != null ? String(r.assignee_name) : null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  }));
  const users = (usersRs.rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
  }));

  const canEdit = perms.includes("*") || perms.includes("task.update");
  const canCreate = perms.includes("*") || perms.includes("task.create");

  return (
    <TaskBoard
      project={project}
      initialTasks={tasks}
      users={users}
      canEdit={canEdit}
      canCreate={canCreate}
    />
  );
}
