/** Structural subset of a libsql client. `args` is narrowed to the value types
 * libsql actually binds, so callers can pass a real client without a cast. */
export type DbLike = {
  execute: (query: {
    sql: string;
    args: (string | number | bigint | ArrayBuffer | boolean | Date | null)[];
  }) => Promise<{ rows: unknown[] }>;
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

/** Path -> required permission per HTTP method. First matching rule wins. */
export type PermRule = { pattern: RegExp; methods: Record<string, string | string[]> };

/** Returns the permission(s) required for this request, or null when unguarded.
 * An array means "any of these is enough" (e.g. approve OR reject). */
export function permissionFor(rules: PermRule[], pathname: string, method: string): string | string[] | null {
  for (const r of rules) {
    if (r.pattern.test(pathname)) return r.methods[method] ?? null;
  }
  return null;
}

export function satisfies(userPerms: string[], required: string | string[]): boolean {
  if (userPerms.includes("*")) return true;
  return Array.isArray(required) ? required.some((p) => userPerms.includes(p)) : userPerms.includes(required);
}
