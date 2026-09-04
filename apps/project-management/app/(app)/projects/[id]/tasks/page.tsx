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

  const project = projectRs.rows[0] as unknown as
    | { id: string; name: string; project_code: string }
    | undefined;
  if (!project) return notFound();

  const tasks = tasksRs.rows as unknown as TaskItem[];
  const users = usersRs.rows as unknown as { id: string; name: string }[];

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
