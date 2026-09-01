import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE, type SessionPayload } from "@metland/auth";

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}
