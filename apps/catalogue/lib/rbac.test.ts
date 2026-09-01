import { describe, expect, it, vi } from "vitest";

vi.mock("@metland/auth", async () => {
  const actual = await vi.importActual<typeof import("@metland/auth")>("@metland/auth");
  return { ...actual, verifySession: vi.fn(), getPermissionsForUser: vi.fn() };
});
vi.mock("@/lib/turso", () => ({ getDb: () => ({}) }));

import { verifySession, getPermissionsForUser, SESSION_COOKIE } from "@metland/auth";
import { requirePerm } from "./rbac";
import type { NextRequest } from "next/server";

function fakeReq(cookie?: string): NextRequest {
  return {
    cookies: { get: (name: string) => (name === SESSION_COOKIE && cookie ? { value: cookie } : undefined) },
    headers: { get: () => null },
  } as unknown as NextRequest;
}

describe("catalogue requirePerm", () => {
  it("denies anonymous requests", async () => {
    const res = await requirePerm(fakeReq(), "catalogue.contractor.manage");
    expect(res?.status).toBe(403);
  });

  it("allows a user with the required permission", async () => {
    vi.mocked(verifySession).mockResolvedValue({ userId: "u1", email: "a@b.com", name: "A" });
    vi.mocked(getPermissionsForUser).mockResolvedValue(["catalogue.contractor.manage"]);
    const res = await requirePerm(fakeReq("token"), "catalogue.contractor.manage");
    expect(res).toBeNull();
  });
});
