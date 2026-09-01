import { afterEach, describe, expect, it, vi } from "vitest";
import { signSession, verifySession } from "./index";

describe("session secret resolution", () => {
  const ORIGINAL_ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllEnvs();
  });

  it("throws when AUTH_SECRET is missing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    await expect(signSession({ userId: "u1", email: "a@b.com", name: "A" })).rejects.toThrow(/AUTH_SECRET/);
  });

  it("still works with the dev fallback outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    const token = await signSession({ userId: "u1", email: "a@b.com", name: "A" });
    const payload = await verifySession(token);
    expect(payload?.userId).toBe("u1");
  });

  it("signs and verifies correctly when AUTH_SECRET is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_SECRET = "a-real-32-char-minimum-secret-value";
    const token = await signSession({ userId: "u2", email: "b@b.com", name: "B" });
    const payload = await verifySession(token);
    expect(payload?.userId).toBe("u2");
  });
});
