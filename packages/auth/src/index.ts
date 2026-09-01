import * as jose from "jose";
import bcrypt from "bcryptjs";

const ALG = "HS256";
const ISS = "metland";
const DEFAULT_EXPIRES = "7d";

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-32chars!!";
  return new TextEncoder().encode(s);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  roles?: string[];
};

export async function signSession(payload: SessionPayload, expiresIn = DEFAULT_EXPIRES): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISS)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret(), { issuer: ISS });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// RBAC helper
export function hasPermission(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes("*") || userPermissions.includes("admin.*")) return true;
  return userPermissions.includes(required);
}

export function requirePermission(userPermissions: string[], required: string) {
  if (!hasPermission(userPermissions, required)) {
    const err = new Error(`Forbidden: missing permission ${required}`);
    (err as unknown as Record<string, unknown>).status = 403;
    throw err;
  }
}

// Session cookie helpers
export const SESSION_COOKIE = "metland_session";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
