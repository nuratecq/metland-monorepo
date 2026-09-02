import type { PermRule } from "@metland/auth";

/** Route -> permission map, enforced centrally in proxy.ts.
 * Order matters: first pattern that matches wins. */
export const CATALOGUE_PERM_RULES: PermRule[] = [
  { pattern: /^\/api\/ecosystem/, methods: {} },

  { pattern: /^\/api\/catalogue\/contractors\/[^/]+$/, methods: { GET: "catalogue.contractor.read", PATCH: "catalogue.contractor.manage", DELETE: "catalogue.contractor.manage" } },
  { pattern: /^\/api\/catalogue\/contractors$/, methods: { GET: "catalogue.contractor.read", POST: "catalogue.contractor.manage" } },
  { pattern: /^\/api\/catalogue\/materials\/[^/]+$/, methods: { GET: "catalogue.material.read", PATCH: "catalogue.material.manage", DELETE: "catalogue.material.manage" } },
  { pattern: /^\/api\/catalogue\/materials$/, methods: { GET: "catalogue.material.read", POST: "catalogue.material.manage" } },

  { pattern: /^\/api\/catalogue\/import/, methods: { POST: "import.create" } },
  { pattern: /^\/api\/catalogue\/recommendations/, methods: { GET: "recommendation.read", POST: "recommendation.create" } },
  { pattern: /^\/api\/catalogue\/(ai-)?search/, methods: { GET: "recommendation.read", POST: "recommendation.create" } },
  { pattern: /^\/api\/catalogue\/reports/, methods: { GET: "catalogue.contractor.read" } },
];
