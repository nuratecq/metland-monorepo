import { describe, expect, it } from "vitest";
import { resolveDbUrl } from "./turso";

describe("resolveDbUrl (catalogue)", () => {
  it("throws in production when no Turso URL is configured", () => {
    expect(() => resolveDbUrl({}, true)).toThrow(/TURSO_CATALOGUE_DATABASE_URL/);
  });

  it("falls back to a local file DB outside production", () => {
    expect(resolveDbUrl({}, false)).toBe("file:./data/catalogue.db");
  });

  it("prefers TURSO_CATALOGUE_DATABASE_URL over TURSO_DATABASE_URL", () => {
    expect(
      resolveDbUrl({ TURSO_CATALOGUE_DATABASE_URL: "libsql://cat.example", TURSO_DATABASE_URL: "libsql://shared.example" }, true)
    ).toBe("libsql://cat.example");
  });

  it("falls back to the shared TURSO_DATABASE_URL when the per-app one is unset", () => {
    expect(resolveDbUrl({ TURSO_DATABASE_URL: "libsql://shared.example" }, true)).toBe("libsql://shared.example");
  });
});
