import { describe, it, expect } from "vitest";
import { progressFor } from "./task-status.js";

describe("progressFor", () => {
  it("completes progress when a task moves to DONE", () => {
    expect(progressFor("IN_PROGRESS", "DONE")).toBe(100);
  });
  it("resets progress when a DONE task is reopened", () => {
    expect(progressFor("DONE", "TODO")).toBe(0);
  });
  it("leaves progress alone for moves between open columns", () => {
    expect(progressFor("TODO", "IN_PROGRESS")).toBeNull();
    expect(progressFor("IN_PROGRESS", "BLOCKED")).toBeNull();
  });
});
