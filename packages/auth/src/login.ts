import bcrypt from "bcryptjs";
import type { DbLike } from "./permissions";

export type LoginResult =
  | { ok: true; userId: string; email: string; name: string }
  | { ok: false; status: number; error: string };

/**
 * Bcrypt hash of a value no user can submit, compared against when the account
 * is missing so a wrong email costs the same time as a wrong password. Without
 * it, response latency leaks which emails are registered.
 */
const DUMMY_HASH = "$2a$10$j3ceX2Rxw05rhCBh1wnuleEPThJNzTe/db5BbJjNjfZpmmFmBSNlq";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Verifies credentials against the users table. Never reveals whether the
 * failure was an unknown email or a bad password — both return the same
 * message, and both run one bcrypt comparison.
 */
export async function authenticate(db: DbLike, emailRaw: unknown, passwordRaw: unknown): Promise<LoginResult> {
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const password = typeof passwordRaw === "string" ? passwordRaw : "";

  if (!EMAIL_RE.test(email) || !password) {
    return { ok: false, status: 400, error: "Email dan password wajib diisi." };
  }

  const rs = await db.execute({
    sql: "SELECT id, email, name, password_hash, status FROM users WHERE lower(email) = ?",
    args: [email],
  });
  const user = rs.rows[0] as { id: string; email: string; name: string; password_hash: string; status?: string } | undefined;

  // Always run a comparison, even with no user, to keep timing uniform.
  const matches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !matches) {
    return { ok: false, status: 401, error: "Email atau password salah." };
  }
  if (user.status && user.status !== "ACTIVE") {
    return { ok: false, status: 403, error: "Akun tidak aktif. Hubungi admin IT." };
  }
  return { ok: true, userId: user.id, email: user.email, name: user.name };
}

/** Rejects passwords too short to be worth hashing. Returns null when valid. */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  return null;
}

/** Sets (or resets) a user's password. Used by seeds and any future admin flow. */
export async function setPassword(db: DbLike, userId: string, plain: string): Promise<void> {
  const problem = validatePasswordStrength(plain);
  if (problem) throw new Error(problem);
  await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE id = ?",
    args: [await bcrypt.hash(plain, 10), userId],
  });
}

export { MIN_PASSWORD_LENGTH };
