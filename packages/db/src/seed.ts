import { createClient } from "@libsql/client";
import { pmSchemaSql } from "./pm.js";
import { catalogueSchemaSql } from "./catalogue.js";

const pmPermissions = [
  "project.read","project.create","project.update","project.delete",
  "task.read","task.create","task.update","task.delete",
  "milestone.read","milestone.manage",
  "document.read","document.upload","document.delete",
  "approval.create","approval.approve","approval.reject",
  "user.manage","audit.read",
];

const cataloguePermissions = [
  "catalogue.contractor.read","catalogue.contractor.manage",
  "catalogue.material.read","catalogue.material.manage",
  "recommendation.read","recommendation.create",
  "approval.read","approval.create","approval.approve","approval.reject",
  "import.create",
];

export async function migratePm(client: ReturnType<typeof createClient>) {
  for (const stmt of pmSchemaSql.split(";").map(s=>s.trim()).filter(Boolean)) {
    await client.execute(stmt);
  }
}

export async function migrateCatalogue(client: ReturnType<typeof createClient>) {
  for (const stmt of catalogueSchemaSql.split(";").map(s=>s.trim()).filter(Boolean)) {
    await client.execute(stmt);
  }
}

export async function seedPermissions(client: ReturnType<typeof createClient>, perms: string[]) {
  for (const name of perms) {
    await client.execute({
      sql: "INSERT OR IGNORE INTO permissions (id, name) VALUES (?, ?)",
      args: [name, name],
    });
  }
}

export { pmPermissions, cataloguePermissions };

/** Read-only role grants. "ends with .read" alone would hand Viewer audit.read
 * too — the audit trail is an admin surface (PRD §18), not general read data. */
export const viewerPerms = (all: string[]) => all.filter((p) => p.endsWith(".read") && p !== "audit.read");
