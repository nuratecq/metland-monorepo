/** Progress to write alongside a kanban status change, or null to leave it.
 * DONE implies 100% and reopening implies not-done — a stale value shows a
 * "DONE" card sitting at 40% on the project detail page. */
export function progressFor(from: string, to: string): number | null {
  if (to === "DONE") return 100;
  if (from === "DONE") return 0;
  return null;
}
