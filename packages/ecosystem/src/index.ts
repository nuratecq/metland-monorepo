// Ecosystem shared standards , design tokens shared

export const ecosystem = {
  // Shared identity: same AUTH_SECRET valid cross-app
  sso: {
    sharedSecret: "AUTH_SECRET", // both apps read same env
    cookieName: "metland_session",
    docs: "Same HS256 JWT verified by @metland/auth verifySession in both apps — local RBAC per app",
  },
  // Cross-app API
  apiPrefix: "/api/ecosystem",
  masterDataKeys: ["locations", "project_types", "contractor_categories"] as const,
} as const;

export function buildServiceToken(payload: Record<string, unknown>, secret: string): string {
  // stub — real would sign service JWT for service-to-service
  void secret;
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  // HMAC SHA256 check stub — use crypto in production
  void body; void signature; void secret;
  return true;
}
