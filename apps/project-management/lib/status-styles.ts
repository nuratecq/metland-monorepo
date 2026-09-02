export const HEALTH_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  GREEN: { bg: "#dcfce7", color: "#166534", label: "On Track" },
  YELLOW: { bg: "#fef3c7", color: "#92400e", label: "At Risk" },
  RED: { bg: "#fee2e2", color: "#991b1b", label: "Delayed" },
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PLANNED: "Planned",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const TASK_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  TODO: { bg: "#f1f5f9", color: "#475569", label: "To Do" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af", label: "In Progress" },
  BLOCKED: { bg: "#fee2e2", color: "#991b1b", label: "Blocked" },
  DONE: { bg: "#dcfce7", color: "#166534", label: "Done" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", label: "Cancelled" },
};

export const DOC_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "#f1f5f9", color: "#475569" },
  UNDER_REVIEW: { bg: "#dbeafe", color: "#1e40af" },
  APPROVED: { bg: "#dcfce7", color: "#166534" },
  REJECTED: { bg: "#fee2e2", color: "#991b1b" },
  ARCHIVED: { bg: "#f1f5f9", color: "#64748b" },
};

export const SEVERITY_STYLE: Record<string, { bg: string; color: string }> = {
  LOW: { bg: "#f1f5f9", color: "#475569" },
  MEDIUM: { bg: "#fef3c7", color: "#92400e" },
  HIGH: { bg: "#ffdad6", color: "#93000a" },
  CRITICAL: { bg: "#fee2e2", color: "#991b1b" },
};
