import React from "react";

export type PhaseTask = { id: string; title: string; status: string };
export type PhaseDoc  = { id: string; file_name: string; category: string | null; status: string };
export type Phase = {
  id: string;
  name: string;
  status: string;
  completion_percentage: number;
  due_date: string | null;
  tasks: PhaseTask[];
  documents: PhaseDoc[];
};

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  DONE:        { color: "#16a34a", bg: "#f0fdf4", label: "Selesai" },
  IN_PROGRESS: { color: "#006767", bg: "#f0fbfa", label: "Berlangsung" },
  BLOCKED:     { color: "#dc2626", bg: "#fef2f2", label: "Terhambat" },
  TODO:        { color: "#94a3b8", bg: "#f1f5f9", label: "Belum Mulai" },
};

const DOC_STATUS_COLOR: Record<string, string> = {
  APPROVED:     "#16a34a",
  UNDER_REVIEW: "#d97706",
  REJECTED:     "#dc2626",
  DRAFT:        "#94a3b8",
  ARCHIVED:     "#64748b",
};

function CheckIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path d="M1.5 4l2 2 3-3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 1h4.5L8 2.5V9H2V1z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/>
      <path d="M6.5 1v2H8" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/>
    </svg>
  );
}

export function PhaseProgress({ phases }: { phases: Phase[] }) {
  if (phases.length === 0) return null;

  const doneCount = phases.filter((p) => p.status === "DONE").length;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] flex items-center justify-between">
        <div className="font-semibold text-[15px]" style={{ fontFamily: "var(--font-hanken)" }}>
          Status Progress Project
        </div>
        <span className="text-[12px] text-[var(--color-on-surface-variant)]">
          {doneCount}/{phases.length} fase selesai
        </span>
      </div>

      {/* Phases — full width, equal columns */}
      <div className="p-4">
        <div className="flex items-stretch gap-0 w-full">
          {phases.map((phase, idx) => {
            const cfg = STATUS_CFG[phase.status] ?? STATUS_CFG.TODO;
            const prevPhase = phases[idx - 1];
            const connectorColor = prevPhase?.status === "DONE" ? "#006767" : "#e2e8f0";
            const doneTasks = phase.tasks.filter((t) => t.status === "DONE").length;
            const totalTasks = phase.tasks.length;
            const isActive = phase.status === "IN_PROGRESS";

            return (
              <React.Fragment key={phase.id}>
                {/* Connector */}
                {idx > 0 && (
                  <div className="flex items-start pt-[37px] flex-none self-start">
                    <div className="w-4 h-[2px]" style={{ background: connectorColor }} />
                  </div>
                )}

                {/* Card — flex-1 so all cards share equal width */}
                <div
                  className="flex-1 min-w-0 rounded-xl overflow-hidden flex flex-col"
                  style={{
                    boxShadow: isActive
                      ? `0 0 0 1.5px ${cfg.color}, 0 1px 3px 0 rgb(0 0 0 / 0.06)`
                      : "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
                  }}
                >
                  {/* Status accent bar */}
                  <div className="h-[3px] flex-none" style={{ background: cfg.color }} />

                  {/* Card header */}
                  <div className="px-3 pt-2.5 pb-2 border-b border-[var(--color-outline-variant)] flex-none">
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <div
                        className="text-[12px] font-semibold text-[var(--color-on-surface)] leading-tight"
                        title={phase.name}
                      >
                        {phase.name}
                      </div>
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-none mt-0.5"
                        style={{ background: cfg.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className="inline-flex h-[17px] px-1.5 items-center rounded text-[10px] font-semibold"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      {phase.due_date && (
                        <span className="text-[10px] text-[var(--color-outline)]">{phase.due_date}</span>
                      )}
                    </div>
                  </div>

                  {/* Tasks section */}
                  {totalTasks > 0 && (
                    <div className="px-3 pt-2.5 pb-2 flex-none">
                      <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--color-outline)] mb-1.5">
                        Tasks
                      </div>
                      <div className="space-y-1.5">
                        {phase.tasks.slice(0, 4).map((task) => {
                          const done = task.status === "DONE";
                          return (
                            <div key={task.id} className="flex items-start gap-1.5">
                              <div
                                className="w-[14px] h-[14px] rounded-full flex items-center justify-center flex-none mt-px"
                                style={{ background: done ? "#f0fdf4" : "var(--color-surface-container-low)" }}
                              >
                                {done && <CheckIcon />}
                              </div>
                              <span
                                className="text-[11px] leading-[1.4]"
                                style={{
                                  color: done ? "var(--color-outline)" : "var(--color-on-surface-variant)",
                                  textDecoration: done ? "line-through" : "none",
                                }}
                              >
                                {task.title}
                              </span>
                            </div>
                          );
                        })}
                        {totalTasks > 4 && (
                          <div className="text-[10px] text-[var(--color-outline)] pl-[18px]">
                            +{totalTasks - 4} lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Divider between tasks and docs */}
                  {totalTasks > 0 && phase.documents.length > 0 && (
                    <div className="mx-3 border-t border-[var(--color-outline-variant)]" />
                  )}

                  {/* Documents section */}
                  {phase.documents.length > 0 && (
                    <div className="px-3 pt-2 pb-2.5 flex-none">
                      <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--color-outline)] mb-1.5">
                        Dokumen
                      </div>
                      <div className="space-y-1.5">
                        {phase.documents.slice(0, 4).map((doc) => {
                          const dotColor = DOC_STATUS_COLOR[doc.status] ?? DOC_STATUS_COLOR.DRAFT;
                          return (
                            <div key={doc.id} className="flex items-start gap-1.5">
                              <div
                                className="flex-none mt-px text-[var(--color-on-surface-variant)]"
                              >
                                <FileIcon />
                              </div>
                              <span className="text-[11px] leading-[1.4] text-[var(--color-on-surface-variant)] truncate flex-1">
                                {doc.file_name}
                              </span>
                              <div
                                className="w-1.5 h-1.5 rounded-full flex-none mt-1"
                                style={{ background: dotColor }}
                                title={doc.status}
                              />
                            </div>
                          );
                        })}
                        {phase.documents.length > 4 && (
                          <div className="text-[10px] text-[var(--color-outline)] pl-[14px]">
                            +{phase.documents.length - 4} dokumen lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {totalTasks === 0 && phase.documents.length === 0 && (
                    <div className="px-3 py-3 text-[11px] text-[var(--color-outline)] italic flex-1">
                      Tidak ada task atau dokumen
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    className="px-3 py-2 border-t border-[var(--color-outline-variant)] flex items-center justify-between mt-auto"
                    style={{ background: "var(--color-surface-container-low)" }}
                  >
                    <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                      {totalTasks > 0 ? `${doneTasks}/${totalTasks} task` : "–"}
                      {phase.documents.length > 0 && ` · ${phase.documents.length} dok`}
                    </span>
                    <span
                      className="text-[13px] font-bold"
                      style={{ color: cfg.color, fontFamily: "var(--font-hanken)" }}
                    >
                      {phase.completion_percentage}%
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
