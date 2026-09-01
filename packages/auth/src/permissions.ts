export type DbLike = {
  execute: (query: { sql: string; args: unknown[] }) => Promise<{ rows: unknown[] }>;
};

/** Joins user_roles -> role_permissions -> permissions. Works against either app's schema (identical shape in pm.ts and catalogue.ts). */
export async function getPermissionsForUser(db: DbLike, userId: string): Promise<string[]> {
  const rs = await db.execute({
    sql: `SELECT DISTINCT p.name as name
          FROM user_roles ur
          JOIN role_permissions rp ON rp.role_id = ur.role_id
          JOIN permissions p ON p.id = rp.permission_id
          WHERE ur.user_id = ?`,
    args: [userId],
  });
  return (rs.rows as { name: string }[]).map((r) => r.name);
}
