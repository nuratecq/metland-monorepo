import { describe, expect, it, vi } from "vitest";

vi.mock("@metland/auth", async () => {
  const actual = await vi.importActual<typeof import("@metland/auth")>("@metland/auth");
  return {
    ...actual,
    verifySession: vi.fn(),
    getPermissionsForUser: vi.fn(),
  };
});
vi.mock("@/lib/turso", () => ({ getDb: () => ({}) }));

import { verifySession, getPermissionsForUser, SESSION_COOKIE } from "@metland/auth";
import { requirePerm } from "./rbac";
import type { NextRequest } from "next/server";

function fakeReq(opts: { cookie?: string; headers?: Record<string, string> }): NextRequest {
  return {
    cookies: { get: (name: string) => (name === SESSION_COOKIE && opts.cookie ? { value: opts.cookie } : undefined) },
    headers: { get: (name: string) => opts.headers?.[name] ?? null },
  } as unknown as NextRequest;
}

describe("requirePerm", () => {
  it("denies anonymous requests (no cookie, no bearer token)", async () => {
    const res = await requirePerm(fakeReq({}), "project.create");
    expect(res?.status).toBe(403);
  });

  it("ignores a spoofed x-permissions header", async () => {
    const res = await requirePerm(fakeReq({ headers: { "x-permissions": "project.create" } }), "project.create");
    expect(res?.status).toBe(403);
  });

  it("denies an authenticated user who lacks the permission", async () => {
    vi.mocked(verifySession).mockResolvedValue({ userId: "u1", email: "a@b.com", name: "A" });
    vi.mocked(getPermissionsForUser).mockResolvedValue(["project.read"]);
    const res = await requirePerm(fakeReq({ cookie: "token" }), "project.create");
    expect(res?.status).toBe(403);
  });

  it("allows an authenticated user who has the permission", async () => {
    vi.mocked(verifySession).mockResolvedValue({ userId: "u1", email: "a@b.com", name: "A" });
    vi.mocked(getPermissionsForUser).mockResolvedValue(["project.read", "project.create"]);
    const res = await requirePerm(fakeReq({ cookie: "token" }), "project.create");
    expect(res).toBeNull();
  });
});
