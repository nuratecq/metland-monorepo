import { describe, expect, it } from "vitest";
import { getPermissionsForUser, type DbLike } from "./permissions";

function fakeDb(rows: { name: string }[]): DbLike {
  return { execute: async () => ({ rows }) };
}

describe("getPermissionsForUser", () => {
  it("returns the distinct permission names granted via the user's roles", async () => {
    const db = fakeDb([{ name: "project.read" }, { name: "project.create" }]);
    const perms = await getPermissionsForUser(db, "user-1");
    expect(perms).toEqual(["project.read", "project.create"]);
  });

  it("returns an empty array when the user has no roles/permissions", async () => {
    const db = fakeDb([]);
    const perms = await getPermissionsForUser(db, "user-2");
    expect(perms).toEqual([]);
  });
});
