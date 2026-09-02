import type { PermRule } from "@metland/auth";

/** Route -> permission map, enforced centrally in proxy.ts.
 * Order matters: first pattern that matches wins. Methods absent from a rule
 * are unguarded (session-only). /api/auth/* never reaches the proxy (matcher). */
export const PM_PERM_RULES: PermRule[] = [
  // ecosystem uses its own x-service-token check, not user permissions
  { pattern: /^\/api\/ecosystem/, methods: {} },
  { pattern: /^\/api\/notifications/, methods: {} },

  { pattern: /^\/api\/approvals\/[^/]+$/, methods: { GET: "approval.create", POST: ["approval.approve", "approval.reject"] } },
  { pattern: /^\/api\/approvals$/, methods: { GET: "approval.create", POST: "approval.create" } },

  { pattern: /^\/api\/projects\/[^/]+\/tasks/, methods: { GET: "task.read", POST: "task.create" } },
  // Kanban column moves — task.update, same as any other field edit.
  { pattern: /^\/api\/tasks\/[^/]+$/, methods: { PATCH: "task.update" } },
  { pattern: /^\/api\/projects\/[^/]+\/milestones/, methods: { GET: "milestone.read", POST: "milestone.manage" } },
  { pattern: /^\/api\/projects\/[^/]+\/issues/, methods: { GET: "project.read", POST: "project.update" } },
  { pattern: /^\/api\/projects\/[^/]+\/documents/, methods: { GET: "document.read", POST: "document.upload" } },
  { pattern: /^\/api\/projects\/[^/]+\/progress/, methods: { GET: "project.read", POST: "project.update" } },
  { pattern: /^\/api\/projects\/[^/]+$/, methods: { GET: "project.read", PATCH: "project.update", DELETE: "project.delete" } },
  { pattern: /^\/api\/projects$/, methods: { GET: "project.read", POST: "project.create" } },

  // Status transitions need upload rights at minimum; APPROVED/REJECTED
  // additionally require approval.approve/reject, checked inside the route.
  { pattern: /^\/api\/documents\/[^/]+$/, methods: { PATCH: "document.upload" } },

  { pattern: /^\/api\/r2\/presign/, methods: { POST: "document.upload" } },
  { pattern: /^\/api\/reports/, methods: { GET: "project.read" } },
];
