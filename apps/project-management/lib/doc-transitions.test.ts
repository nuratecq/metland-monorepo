import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/** The route and the button component each hold a copy of the transition map.
 * They must agree, or the UI offers a move the server refuses (or hides a legal
 * one). Parsing both files is cheaper than extracting the map into a package. */
function mapFrom(file: string): Record<string, string[]> {
  const src = readFileSync(join(__dirname, "..", file), "utf8");
  const block = src.match(/const NEXT: Record<string, string\[\]> = \{([\s\S]*?)\n\};/);
  if (!block) throw new Error(`no NEXT map in ${file}`);
  const out: Record<string, string[]> = {};
  for (const [, k, v] of block[1].matchAll(/(\w+):\s*\[([^\]]*)\]/g)) {
    out[k] = v.split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean);
  }
  return out;
}

describe("document status transitions", () => {
  const server = mapFrom("app/api/documents/[id]/route.ts");
  const client = mapFrom("components/forms/DocumentStatus.tsx");

  it("client map matches server map", () => {
    expect(client).toEqual(server);
  });

  it("covers every schema status and terminates at ARCHIVED", () => {
    expect(Object.keys(server).sort()).toEqual(["APPROVED", "ARCHIVED", "DRAFT", "REJECTED", "UNDER_REVIEW"]);
    expect(server.ARCHIVED).toEqual([]);
  });

  it("never skips review on the way to a verdict", () => {
    expect(server.DRAFT).not.toContain("APPROVED");
    expect(server.DRAFT).not.toContain("REJECTED");
  });

  it("only targets known statuses", () => {
    for (const targets of Object.values(server)) {
      for (const t of targets) expect(Object.keys(server)).toContain(t);
    }
  });
});
