import { describe, expect, it } from "vitest";
import { buildProjectInsight } from "./insight";

describe("buildProjectInsight", () => {
  it("reports On Track with no follow-up actions when everything is healthy", () => {
    const { insight, actions } = buildProjectInsight({
      progress: 80,
      health: "GREEN",
      overdueMilestones: 0,
      overdueTasks: 0,
      daysToDeadline: 40,
    });
    expect(insight).toContain("On Track");
    expect(actions).toEqual(["Pertahankan kecepatan saat ini dan lanjutkan pelaporan progres mingguan."]);
  });

  it("flags overdue milestones and tasks when health is RED", () => {
    const { insight, actions } = buildProjectInsight({
      progress: 40,
      health: "RED",
      overdueMilestones: 2,
      overdueTasks: 3,
      daysToDeadline: -5,
    });
    expect(insight).toContain("Delayed");
    expect(actions).toContain("Tinjau ulang 2 milestone yang terlambat dan realokasikan sumber daya bila perlu.");
    expect(actions).toContain("Hubungi penanggung jawab dari 3 task yang melewati tenggat untuk pembaruan status.");
    expect(actions.some((a) => a.includes("Tenggat proyek telah lewat 5 hari"))).toBe(true);
  });
});
