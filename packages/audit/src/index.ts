import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

export type AuditInput = {
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: unknown;
  new_value?: unknown;
  ip_address?: string;
  user_agent?: string;
};

export async function writeAudit(
  client: ReturnType<typeof createClient>,
  input: AuditInput,
) {
  await client.execute({
    sql: `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      randomUUID(),
      input.user_id ?? null,
      input.action,
      input.entity_type,
      input.entity_id,
      input.old_value ? JSON.stringify(input.old_value) : null,
      input.new_value ? JSON.stringify(input.new_value) : null,
      input.ip_address ?? null,
      input.user_agent ?? null,
    ],
  });
}
