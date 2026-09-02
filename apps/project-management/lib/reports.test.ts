import { describe, expect, it } from "vitest";
import { toCsv } from "./export";
import { asDate, conclude } from "./reports";

describe("asDate", () => {
  it("accepts ISO dates and rejects anything else", () => {
    expect(asDate("2026-09-02")).toBe("2026-09-02");
    expect(asDate("02/09/2026")).toBeNull();
    expect(asDate("2026-09-02'; DROP TABLE projects--")).toBeNull();
    expect(asDate(undefined)).toBeNull();
  });
});

describe("conclude", () => {
  it("prioritises health over progress", () => {
    expect(conclude(90, "RED", 3, 2)).toMatch(/^Delayed/);
    expect(conclude(90, "YELLOW", 1, 0)).toMatch(/^At risk/);
    expect(conclude(100, "GREEN", 0, 0)).toMatch(/^Selesai/);
    expect(conclude(40, "GREEN", 0, 0)).toBe("On track — progress 40%.");
    expect(conclude(40, "GREEN", 2, 0)).toContain("2 task overdue");
  });
});

describe("toCsv", () => {
  it("quotes fields containing commas, quotes, or newlines", () => {
    const csv = toCsv([{ name: "S", rows: [["a,b", 'say "hi"', "line\nbreak", null, 7]] }]);
    expect(csv).toBe('# S\n"a,b","say ""hi""","line\nbreak",,7');
  });
});
