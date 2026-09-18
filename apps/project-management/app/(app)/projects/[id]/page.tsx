import { getDb } from "@/lib/turso";
import { FieldUpdateForm } from "@/components/forms/FieldUpdateForm";
import { InlineCreate } from "@/components/forms/InlineCreate";
import { DocumentUpload } from "@/components/forms/DocumentUpload";
import { DocumentStatus } from "@/components/forms/DocumentStatus";
import { buildProjectInsight } from "@/lib/insight";
import { HEALTH_STYLE, PROJECT_STATUS_LABEL, SEVERITY_STYLE, DOC_STATUS_STYLE } from "@/lib/status-styles";
import { CheckSquare, FileText, AlertTriangle, CalendarClock, TrendingUp, Sparkles } from "lucide-react";
import { MilestoneChart } from "@/components/projects/MilestoneChart";
import { PhaseProgress } from "@/components/projects/PhaseProgress";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Project = {
  id: string; project_code: string; name: string; description: string | null;
  location_text: string | null; status: string; health_status: "GREEN" | "YELLOW" | "RED";
  progress: number; start_date: string | null; planned_end_date: string | null;
  manager_name: string | null; created_at: string;
};
type Milestone = { id: string; name: string; completion_percentage: number; status: string; due_date: string | null };
type Issue = { id: string; title: string; severity: string; status: string };
type AuditLog = { id: string; action: string; new_value: string | null; created_at: string };
type Doc = { id: string; file_name: string; category: string | null; status: string; file_size: number; uploader_name: string | null };

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const projectRs = await db
    .execute({
      sql: `SELECT p.*, u.name as manager_name FROM projects p LEFT JOIN users u ON u.id = p.manager_id WHERE p.id = ?`,
      args: [id],
    })
    .catch(() => ({ rows: [] } as never as { rows: unknown[] }));
  const project = projectRs.rows[0] as unknown as Project | undefined;
  if (!project) return notFound();

  const milestones = await db
    .execute({ sql: "SELECT id, name, completion_percentage, status, due_date FROM milestones WHERE project_id = ? ORDER BY due_date ASC", args: [id] })
    .then((r) => r.rows.map((row) => {
      const m = row as unknown as Record<string, unknown>;
      return {
        id: String(m.id ?? ""),
        name: String(m.name ?? ""),
        completion_percentage: Number(m.completion_percentage ?? 0),
        status: String(m.status ?? "TODO"),
        due_date: m.due_date != null ? String(m.due_date) : null,
      } satisfies Milestone;
    }))
    .catch(() => [] as Milestone[]);

  const today = new Date().toISOString().slice(0, 10);

  const phaseTasks = await db
    .execute({
      sql: "SELECT id, title, status, milestone_id FROM tasks WHERE project_id = ? AND milestone_id IS NOT NULL ORDER BY created_at ASC",
      args: [id],
    })
    .then((r) => r.rows.map((row) => {
      const t = row as unknown as Record<string, unknown>;
      return {
        id: String(t.id ?? ""),
        title: String(t.title ?? ""),
        status: String(t.status ?? "TODO"),
        milestone_id: String(t.milestone_id ?? ""),
      };
    }))
    .catch(() => [] as { id: string; title: string; status: string; milestone_id: string }[]);

  // 4 fixed pipeline stages — names & docs always the same, status/tasks from DB by index
  const PIPELINE_STAGES = [
    {
      name: "Feasibility Study",
      docs: ["Submit Data Finance", "Submit Data Marketing", "Submit Data Siteplan"],
    },
    {
      name: "Quantity Surveyor",
      docs: ["Submit Progress Tender", "Submit Schedule", "Submit Material", "Submit Dokumen Kerja"],
    },
    {
      name: "Design Plan",
      docs: ["Submit Progress Tender", "Submit Schedule", "Submit Material", "Submit Gambar", "Submit Dokumen"],
    },
    {
      name: "Construction",
      docs: ["Submit Schedule", "Submit Progress Kerja", "Submit Materials", "Submit Dokumen Kerja"],
    },
  ];

  function docStatusForPhase(phaseStatus: string, docIdx: number): string {
    if (phaseStatus === "DONE") return "APPROVED";
    if (phaseStatus === "IN_PROGRESS") return docIdx < 2 ? "APPROVED" : "DRAFT";
    if (phaseStatus === "BLOCKED") return docIdx === 2 ? "REJECTED" : "DRAFT";
    return "DRAFT";
  }

  const tasksByMilestone = new Map<string, typeof phaseTasks>();
  for (const t of phaseTasks) {
    const arr = tasksByMilestone.get(t.milestone_id) ?? [];
    arr.push(t);
    tasksByMilestone.set(t.milestone_id, arr);
  }
  const phases = PIPELINE_STAGES.map((stage, stageIdx) => {
    const m = milestones[stageIdx];
    const phaseStatus = m?.status ?? "TODO";
    const phaseId = m?.id ?? `stage-${stageIdx}`;
    return {
      id: phaseId,
      name: stage.name,
      status: phaseStatus,
      completion_percentage: m?.completion_percentage ?? 0,
      due_date: m?.due_date ?? null,
      tasks: m ? (tasksByMilestone.get(m.id) ?? []).map(({ milestone_id: _, ...rest }) => rest) : [],
      documents: stage.docs.map((docName, i) => ({
        id: `${phaseId}-doc-${i}`,
        file_name: `${docName}.pdf`,
        category: "Approval" as const,
        status: docStatusForPhase(phaseStatus, i),
      })),
    };
  });

  const overdueTasksRs = await db
    .execute({
      sql: `SELECT COUNT(*) as cnt FROM tasks WHERE project_id = ? AND due_date < ? AND status NOT IN ('DONE', 'CANCELLED')`,
      args: [id, today],
    })
    .catch(() => ({ rows: [{ cnt: 0 }] }));
  const overdueTasks = Number((overdueTasksRs.rows[0] as unknown as { cnt: number })?.cnt ?? 0);

  const issues = await db
    .execute({ sql: "SELECT id, title, severity, status FROM issues WHERE project_id = ? ORDER BY created_at DESC LIMIT 10", args: [id] })
    .then((r) => r.rows as unknown as Issue[])
    .catch(() => []);

  const docs = await db
    .execute({
      sql: `SELECT d.id, d.file_name, d.category, d.status, d.file_size, u.name as uploader_name
            FROM documents d LEFT JOIN users u ON u.id = d.uploaded_by
            WHERE d.entity_type='project' AND d.entity_id=? ORDER BY d.uploaded_at DESC LIMIT 20`,
      args: [id],
    })
    .then((r) => r.rows as unknown as Doc[])
    .catch(() => []);

  const logs = await db
    .execute({ sql: "SELECT id, action, new_value, created_at FROM audit_logs WHERE entity_type='project' AND entity_id=? ORDER BY created_at DESC LIMIT 10", args: [id] })
    .then((r) => r.rows as unknown as AuditLog[])
    .catch(() => []);

  const overdueMilestones = milestones.filter((m) => m.due_date && m.due_date < today && m.status !== "DONE").length;
  const daysToDeadline = project.planned_end_date
    ? Math.ceil((new Date(project.planned_end_date).getTime() - new Date(today).getTime()) / 86400000)
    : null;

  const { insight, actions } = buildProjectInsight({
    progress: project.progress,
    health: project.health_status,
    overdueMilestones,
    overdueTasks,
    daysToDeadline,
  });

  const h = HEALTH_STYLE[project.health_status] ?? HEALTH_STYLE.GREEN;

  return (
    <div className="space-y-5">
      {/* Back nav */}
      <div className="flex items-center gap-2">
        <Link
          href="/projects"
          className="inline-flex h-8 items-center px-3 rounded-lg bg-white shadow-sm text-[13px] font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
        >
          ← Semua proyek
        </Link>
        <Link
          href={`/projects/${id}/tasks`}
          className="inline-flex h-8 items-center gap-1.5 px-3 rounded-lg bg-white shadow-sm text-[13px] font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
        >
          <CheckSquare size={13} className="shrink-0" />
          Tasks
          {overdueTasks > 0 && (
            <span className="ml-0.5 h-[18px] min-w-[18px] px-1 rounded-full bg-[var(--color-error)] text-white text-[10px] font-bold inline-flex items-center justify-center">
              {overdueTasks}
            </span>
          )}
        </Link>
      </div>

      {/* Project header */}
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{project.project_code}</span>
            <span
              className="h-[20px] px-2 inline-flex items-center rounded text-[11px] font-semibold"
              style={{ background: h.bg, color: h.color }}
            >
              {h.label}
            </span>
            <span className="text-[12px] text-[var(--color-on-surface-variant)]">
              {PROJECT_STATUS_LABEL[project.status] ?? project.status}
            </span>
          </div>
          <h1 className="mt-1.5 text-[28px] leading-9 font-bold" style={{ fontFamily: "var(--font-hanken)" }}>
            {project.name}
          </h1>
          <div className="mt-1 text-[14px] text-[var(--color-on-surface-variant)]">
            {project.location_text ?? "Lokasi belum diisi"}
          </div>
        </div>
        <div className="flex gap-2 flex-none">
          <a
            href="#update"
            className="h-9 px-4 flex items-center rounded-lg border border-[var(--color-outline-variant)] bg-white text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            Unggah progres
          </a>
          <a
            href="#update"
            className="h-9 px-4 flex items-center rounded-lg bg-[var(--color-primary)] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Edit proyek
          </a>
        </div>
      </div>

      {/* Phase progress stepper */}
      <PhaseProgress phases={phases} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[var(--color-on-surface-variant)]">Progres</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
              <TrendingUp size={13} className="text-[var(--color-primary)]" />
            </div>
          </div>
          <div className="text-[2rem] font-bold leading-none" style={{ fontFamily: "var(--font-hanken)", color: "var(--color-primary)" }}>
            {project.progress}%
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        {/* Health */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[var(--color-on-surface-variant)]">Kesehatan</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: h.bg }}>
              <span className="w-2 h-2 rounded-full" style={{ background: h.color }} />
            </div>
          </div>
          <div className="text-[2rem] font-bold leading-none" style={{ fontFamily: "var(--font-hanken)", color: h.color }}>
            {h.label}
          </div>
        </div>

        {/* Overdue tasks */}
        <Link
          href={`/projects/${id}/tasks`}
          className="bg-white rounded-xl shadow-sm p-4 hover:opacity-90 transition-opacity group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[var(--color-on-surface-variant)]">Task Terlambat</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={13} className="text-red-500" />
            </div>
          </div>
          <div
            className="text-[2rem] font-bold leading-none"
            style={{ fontFamily: "var(--font-hanken)", color: overdueTasks > 0 ? "#dc2626" : "var(--color-on-surface)" }}
          >
            {overdueTasks}
          </div>
          <div className="mt-1 text-[12px] text-[var(--color-on-surface-variant)]">Lihat tasks →</div>
        </Link>

        {/* Days to deadline */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[var(--color-on-surface-variant)]">Hari ke Tenggat</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <CalendarClock size={13} className="text-orange-500" />
            </div>
          </div>
          <div
            className="text-[2rem] font-bold leading-none"
            style={{
              fontFamily: "var(--font-hanken)",
              color: daysToDeadline !== null && daysToDeadline < 7 ? "#dc2626" : "var(--color-on-surface)",
            }}
          >
            {daysToDeadline ?? "—"}
          </div>
          {project.planned_end_date && (
            <div className="mt-1 text-[12px] text-[var(--color-on-surface-variant)]">{project.planned_end_date}</div>
          )}
        </div>
      </div>

      {/* Main body */}
      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-5 items-start">
        {/* Left */}
        <div className="flex flex-col gap-5">
          {/* Milestones */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] flex items-center justify-between">
              <div className="font-semibold text-[15px]" style={{ fontFamily: "var(--font-hanken)" }}>Progres per fase</div>
              <span className="text-[12px] text-[var(--color-on-surface-variant)]">{milestones.length} milestone</span>
            </div>
            <div className="px-2 py-3">
              <MilestoneChart milestones={milestones} />
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] font-semibold text-[15px]" style={{ fontFamily: "var(--font-hanken)" }}>
                Issues — {issues.length}
              </div>
              <div className="divide-y divide-[var(--color-outline-variant)]">
                {issues.map((iss) => {
                  const sv = SEVERITY_STYLE[iss.severity] ?? SEVERITY_STYLE.LOW;
                  return (
                    <div key={iss.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="text-[13px] font-medium text-[var(--color-on-surface)]">{iss.title}</div>
                      <span
                        className="h-[20px] px-2 inline-flex items-center rounded text-[11px] font-semibold flex-none"
                        style={{ background: sv.bg, color: sv.color }}
                      >
                        {iss.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] font-semibold text-[15px]" style={{ fontFamily: "var(--font-hanken)" }}>
              Dokumen — {docs.length}
            </div>
            {docs.length === 0 ? (
              <div className="px-4 py-6 flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)]">
                <FileText size={14} className="opacity-40" />
                Belum ada dokumen
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-outline-variant)]">
                {docs.map((d) => {
                  const st = DOC_STATUS_STYLE[d.status] ?? DOC_STATUS_STYLE.DRAFT;
                  return (
                    <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[var(--color-on-surface)] truncate">{d.file_name}</div>
                        <div className="text-[11px] text-[var(--color-on-surface-variant)]">
                          {d.category ?? "Other"} · {Math.max(1, Math.round(d.file_size / 1024))} KB · {d.uploader_name ?? "—"}
                        </div>
                      </div>
                      <span className="flex items-center gap-2 flex-none">
                        <DocumentStatus documentId={d.id} status={d.status} />
                        <span
                          className="h-[20px] px-2 inline-flex items-center rounded text-[11px] font-semibold"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {d.status}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Forms */}
          <div id="update" className="grid md:grid-cols-2 gap-5">
            <FieldUpdateForm projectId={id} />
            <InlineCreate projectId={id} />
            <DocumentUpload projectId={id} />
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-5">
          {/* AI Insight */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Health-colored top accent bar */}
            <div className="h-1" style={{ background: h.color }} />

            <div className="p-5">
              {/* Header row */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-container-low)] flex items-center justify-center">
                  <Sparkles size={14} className="text-[var(--color-primary)]" />
                </div>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">
                  Analisis Otomatis
                </span>
                <span
                  className="ml-auto h-[20px] px-2 inline-flex items-center rounded text-[11px] font-semibold"
                  style={{ background: h.bg, color: h.color }}
                >
                  {h.label}
                </span>
              </div>

              {/* Insight paragraph */}
              <p className="text-[14px] leading-[1.65] text-[var(--color-on-surface)]">{insight}</p>

              {/* Divider + action items */}
              <div className="mt-4 pt-4 border-t border-[var(--color-surface-container-high)]">
                <div className="text-[10px] font-bold tracking-widest uppercase text-[var(--color-outline)] mb-3">
                  Rekomendasi
                </div>
                <div className="flex flex-col gap-2.5">
                  {actions.map((a, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <div
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                        style={{ background: h.color }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[13px] text-[var(--color-on-surface-variant)] leading-snug">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Project info */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] font-semibold text-[15px]" style={{ fontFamily: "var(--font-hanken)" }}>
              Informasi Proyek
            </div>
            <div className="px-4">
              {[
                ["Kode", project.project_code],
                ["Manager", project.manager_name ?? "—"],
                ["Lokasi", project.location_text ?? "—"],
                ["Mulai", project.start_date ?? "—"],
                ["Target selesai", project.planned_end_date ?? "—"],
                ["Status", PROJECT_STATUS_LABEL[project.status] ?? project.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-[var(--color-surface-container-low)] last:border-0">
                  <div className="text-[13px] text-[var(--color-on-surface-variant)]">{k}</div>
                  <div className="text-[13px] font-medium text-right text-[var(--color-on-surface)]">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit log */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] font-semibold text-[15px]" style={{ fontFamily: "var(--font-hanken)" }}>
              Log Aktivitas
            </div>
            <div className="p-4">
              {logs.length === 0 ? (
                <div className="text-sm text-[var(--color-on-surface-variant)]">Belum ada aktivitas tercatat.</div>
              ) : (
                <div className="flex flex-col gap-0">
                  {logs.map((l, idx) => (
                    <div key={l.id} className="grid grid-cols-[16px_1fr] gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1 shrink-0" />
                        {idx < logs.length - 1 && <div className="w-px flex-1 bg-[var(--color-surface-container-high)]" />}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[var(--color-on-surface)]">
                          {l.action.replace(/_/g, " ")}
                        </div>
                        <div className="font-mono text-[11px] text-[var(--color-on-surface-variant)]">
                          {new Date(l.created_at).toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
