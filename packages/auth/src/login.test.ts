import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { authenticate, validatePasswordStrength } from "./login";

const HASH = bcrypt.hashSync("correct-horse-battery", 10);

function db(rows: unknown[]) {
  return { execute: async () => ({ rows }) };
}

const ACTIVE = [{ id: "u1", email: "a@metland.co.id", name: "A", password_hash: HASH, status: "ACTIVE" }];

describe("authenticate", () => {
  it("accepts the correct password", async () => {
    const r = await authenticate(db(ACTIVE), "a@metland.co.id", "correct-horse-battery");
    expect(r).toMatchObject({ ok: true, userId: "u1" });
  });

  it("rejects a wrong password", async () => {
    const r = await authenticate(db(ACTIVE), "a@metland.co.id", "wrong");
    expect(r).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects an unknown email with the same message as a wrong password", async () => {
    const unknown = await authenticate(db([]), "nobody@metland.co.id", "whatever");
    const wrong = await authenticate(db(ACTIVE), "a@metland.co.id", "wrong");
    expect(unknown).toMatchObject({ ok: false, status: 401 });
    // Identical wording is what stops the endpoint enumerating valid accounts.
    expect((unknown as { error: string }).error).toBe((wrong as { error: string }).error);
  });

  it("rejects an empty password even when the row exists", async () => {
    const r = await authenticate(db(ACTIVE), "a@metland.co.id", "");
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it("does not treat a stored plaintext 'demo' hash as a match", async () => {
    const legacy = [{ id: "u2", email: "b@metland.co.id", name: "B", password_hash: "demo", status: "ACTIVE" }];
    expect(await authenticate(db(legacy), "b@metland.co.id", "demo")).toMatchObject({ ok: false, status: 401 });
  });

  it("blocks a non-active account that has the right password", async () => {
    const inactive = [{ ...ACTIVE[0], status: "INACTIVE" }];
    const r = await authenticate(db(inactive), "a@metland.co.id", "correct-horse-battery");
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it("matches email case-insensitively", async () => {
    expect(await authenticate(db(ACTIVE), "  A@Metland.co.id ", "correct-horse-battery")).toMatchObject({ ok: true });
  });
});

describe("validatePasswordStrength", () => {
  it("rejects short passwords and accepts long ones", () => {
    expect(validatePasswordStrength("short")).toMatch(/minimal/);
    expect(validatePasswordStrength("longenough1")).toBeNull();
  });
});
