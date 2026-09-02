import { describe, it, expect } from "vitest";
import { permissionFor, satisfies } from "@metland/auth";
import { PM_PERM_RULES } from "./perm-rules";
import { CATALOGUE_PERM_RULES } from "../../catalogue/lib/perm-rules";

describe("permissionFor", () => {
  it("maps method to permission", () => {
    expect(permissionFor(PM_PERM_RULES, "/api/projects", "GET")).toBe("project.read");
    expect(permissionFor(PM_PERM_RULES, "/api/projects", "POST")).toBe("project.create");
    expect(permissionFor(PM_PERM_RULES, "/api/projects/abc", "DELETE")).toBe("project.delete");
  });

  it("does not let /api/projects/:id swallow its sub-resources", () => {
    expect(permissionFor(PM_PERM_RULES, "/api/projects/abc/tasks", "POST")).toBe("task.create");
    expect(permissionFor(PM_PERM_RULES, "/api/projects/abc/documents", "POST")).toBe("document.upload");
  });

  it("returns null for unguarded routes and unmapped methods", () => {
    expect(permissionFor(PM_PERM_RULES, "/api/ecosystem", "GET")).toBeNull();
    expect(permissionFor(PM_PERM_RULES, "/api/notifications", "PATCH")).toBeNull();
    expect(permissionFor(PM_PERM_RULES, "/api/unknown", "GET")).toBeNull();
  });

  it("guards catalogue writes but allows reads at read permission", () => {
    expect(permissionFor(CATALOGUE_PERM_RULES, "/api/catalogue/contractors", "GET")).toBe("catalogue.contractor.read");
    expect(permissionFor(CATALOGUE_PERM_RULES, "/api/catalogue/contractors/x1", "DELETE")).toBe("catalogue.contractor.manage");
    expect(permissionFor(CATALOGUE_PERM_RULES, "/api/catalogue/import", "POST")).toBe("import.create");
  });
});

describe("satisfies", () => {
  it("accepts any one of an array (approve OR reject)", () => {
    const required = permissionFor(PM_PERM_RULES, "/api/approvals/a1", "POST")!;
    expect(satisfies(["approval.reject"], required)).toBe(true);
    expect(satisfies(["project.read"], required)).toBe(false);
  });

  it("wildcard grants everything", () => {
    expect(satisfies(["*"], "anything.at.all")).toBe(true);
  });

  it("empty permissions grant nothing", () => {
    expect(satisfies([], "project.read")).toBe(false);
  });
});
