import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// Mock getDb to avoid turso module resolution issues
vi.mock("@/lib/turso", () => ({
  getDb: vi.fn(),
}));

import { verifyServiceToken } from "./route";

function fakeReq(token: string | null): NextRequest {
  return { headers: { get: (name: string) => (name === "x-service-token" ? token : null) } } as unknown as NextRequest;
}

describe("verifyServiceToken", () => {
  it("denies when AUTH_SECRET is unset and running in production", () => {
    delete process.env.AUTH_SECRET;
    expect(verifyServiceToken(fakeReq(null), true)).toBe(false);
  });

  it("allows in dev when AUTH_SECRET is unset (existing convenience)", () => {
    delete process.env.AUTH_SECRET;
    expect(verifyServiceToken(fakeReq(null), false)).toBe(true);
  });

  it("requires a matching token when AUTH_SECRET is set", () => {
    process.env.AUTH_SECRET = "shared-secret-value";
    expect(verifyServiceToken(fakeReq("shared-secret-value"), true)).toBe(true);
    expect(verifyServiceToken(fakeReq("wrong"), true)).toBe(false);
    delete process.env.AUTH_SECRET;
  });
});
