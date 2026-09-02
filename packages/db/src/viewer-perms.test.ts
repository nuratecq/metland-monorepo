import { describe, it, expect } from "vitest";
import { pmPermissions, cataloguePermissions, viewerPerms } from "./seed.js";

describe("viewerPerms", () => {
  it("never grants audit.read — audit trail is an admin surface", () => {
    expect(viewerPerms(pmPermissions)).not.toContain("audit.read");
  });
  it("keeps ordinary read permissions", () => {
    expect(viewerPerms(pmPermissions)).toContain("project.read");
    expect(viewerPerms(cataloguePermissions)).toContain("catalogue.contractor.read");
  });
  it("drops every write permission", () => {
    expect(viewerPerms(pmPermissions).filter((p) => !p.endsWith(".read"))).toEqual([]);
  });
});
