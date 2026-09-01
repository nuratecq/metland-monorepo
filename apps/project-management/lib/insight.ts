export type ProjectInsightInput = {
  progress: number;
  health: "GREEN" | "YELLOW" | "RED";
  overdueMilestones: number;
  overdueTasks: number;
  daysToDeadline: number | null;
};

/**
 * Deterministic, template-only guardrail — no LLM call. Text is built solely
 * from real project data so it can never contradict the numbers shown on screen.
 */
export function buildProjectInsight(input: ProjectInsightInput): { insight: string; actions: string[] } {
  const { progress, health, overdueMilestones, overdueTasks, daysToDeadline } = input;
  const actions: string[] = [];

  let insight: string;
  if (health === "RED") {
    insight = `Proyek berstatus Delayed. Progres saat ini ${progress}%, dengan ${overdueMilestones} milestone dan ${overdueTasks} task yang telah melewati tenggat.`;
  } else if (health === "YELLOW") {
    insight = `Proyek berisiko (At Risk). Progres saat ini ${progress}%, ada item yang mendekati tenggat dan perlu dipantau agar tidak terlambat.`;
  } else {
    insight = `Proyek berjalan sesuai rencana (On Track). Progres saat ini ${progress}% dan seluruh milestone berada dalam jadwal.`;
  }

  if (overdueMilestones > 0) {
    actions.push(`Tinjau ulang ${overdueMilestones} milestone yang terlambat dan realokasikan sumber daya bila perlu.`);
  }
  if (overdueTasks > 0) {
    actions.push(`Hubungi penanggung jawab dari ${overdueTasks} task yang melewati tenggat untuk pembaruan status.`);
  }
  if (daysToDeadline !== null && daysToDeadline >= 0 && daysToDeadline <= 14 && progress < 90) {
    actions.push(`Percepat penyelesaian — tenggat proyek tinggal ${daysToDeadline} hari sementara progres baru ${progress}%.`);
  }
  if (daysToDeadline !== null && daysToDeadline < 0 && health !== "GREEN") {
    actions.push(`Tenggat proyek telah lewat ${Math.abs(daysToDeadline)} hari — pertimbangkan revisi jadwal.`);
  }
  if (actions.length === 0) {
    actions.push("Pertahankan kecepatan saat ini dan lanjutkan pelaporan progres mingguan.");
  }

  return { insight, actions };
}
