import { getDb } from "@/lib/turso";
import { FieldUpdateForm } from "@/components/forms/FieldUpdateForm";
import { InlineCreate } from "@/components/forms/InlineCreate";
import { DocumentUpload } from "@/components/forms/DocumentUpload";
import { DocumentStatus } from "@/components/forms/DocumentStatus";
import { buildProjectInsight } from "@/lib/insight";
import { HEALTH_STYLE, PROJECT_STATUS_LABEL, SEVERITY_STYLE, DOC_STATUS_STYLE } from "@/lib/status-styles";
import { CheckSquare } from "lucide-react";
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
    .execute({ sql: "SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC", args: [id] })
    .then((r) => r.rows as unknown as Milestone[])
    .catch(() => []);

  const today = new Date().toISOString().slice(0, 10);

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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/projects" className="inline-flex h-8 items-center px-3 border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
          ← Semua proyek
        </Link>
        <Link href={`/projects/${id}/tasks`} className="inline-flex h-8 items-center gap-1.5 px-3 border border-[var(--color-outline-variant)] bg-white rounded text-[13px] font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
          <CheckSquare size={14} className="shrink-0" />
          Tasks
          {overdueTasks > 0 && (
            <span className="ml-0.5 h-[18px] min-w-[18px] px-1 rounded-full bg-[var(--color-error)] text-white text-[11px] font-bold inline-flex items-center justify-center">
              {overdueTasks}
            </span>
          )}
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[13px] text-[var(--color-data-mono)]">{project.project_code}</span>
            <span className="h-[22px] px-2 inline-flex items-center rounded text-xs font-semibold tracking-wide uppercase" style={{ background: h.bg, color: h.color }}>
              {h.label}
            </span>
          </div>
          <h1 className="mt-2 text-[32px] leading-10 font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>{project.name}</h1>
          <div className="mt-1.5 text-[15px] text-[var(--color-on-surface-variant)]">{project.location_text ?? "Lokasi belum diisi"}</div>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2.5 flex-none">
          <a href="#update" className="h-[38px] px-4 flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-sm font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
            Unggah progres
          </a>
          <a href="#update" className="h-[38px] px-4 flex items-center bg-[var(--color-primary)] rounded text-sm font-semibold text-white hover:bg-[var(--color-primary-container)]">
            Edit proyek
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[var(--color-outline-variant)] rounded p-4">
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">Progres</div>
          <div className="mt-2 text-3xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>{project.progress}%</div>
        </div>
        <div className="bg-white border border-[var(--color-outline-variant)] rounded p-4">
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">Kesehatan</div>
          <div className="mt-2 text-3xl font-bold" style={{ fontFamily: "var(--font-hanken)", color: h.color }}>{h.label}</div>
          <div className="mt-1 text-[13px] text-[var(--color-outline)]">{PROJECT_STATUS_LABEL[project.status] ?? project.status}</div>
        </div>
        <Link
          href={`/projects/${id}/tasks`}
          className="bg-white border border-[var(--color-outline-variant)] rounded p-4 hover:border-[var(--color-primary)] transition-colors group"
        >
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">Task Terlambat</div>
          <div className="mt-2 text-3xl font-bold group-hover:text-[var(--color-primary)] transition-colors" style={{ fontFamily: "var(--font-hanken)", color: overdueTasks > 0 ? "var(--color-error)" : undefined }}>{overdueTasks}</div>
          <div className="mt-1 text-[13px] text-[var(--color-outline)] group-hover:text-[var(--color-primary)] transition-colors">Lihat tasks →</div>
        </Link>
        <div className="bg-white border border-[var(--color-outline-variant)] rounded p-4">
          <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">Hari ke Tenggat</div>
          <div className="mt-2 text-3xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>{daysToDeadline ?? "—"}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-[var(--color-outline-variant)] rounded">
            <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] flex items-center justify-between">
              <div className="font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Progres per fase</div>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {milestones.length === 0 ? (
                <div className="text-sm text-[var(--color-on-surface-variant)]">Belum ada milestone.</div>
              ) : (
                milestones.map((m) => (
                  <div key={m.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="font-mono text-[13px] text-[var(--color-on-surface-variant)]">{m.completion_percentage}% · {m.due_date ?? "tanpa tenggat"}</div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${m.completion_percentage}%`, background: m.status === "DONE" ? HEALTH_STYLE.GREEN.color : "var(--color-primary)" }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {issues.length > 0 ? (
            <div className="bg-white border border-[var(--color-outline-variant)] rounded">
              <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>
                Issues — {issues.length}
              </div>
              <div className="p-4 flex flex-col gap-2">
                {issues.map((iss) => {
                  const sv = SEVERITY_STYLE[iss.severity] ?? SEVERITY_STYLE.LOW;
                  return (
                    <div key={iss.id} className="flex items-center justify-between gap-3 border border-[var(--color-surface-container-high)] rounded px-3 py-2">
                      <div className="text-sm font-medium">{iss.title}</div>
                      <span className="h-[22px] px-2 inline-flex items-center rounded text-xs font-semibold tracking-wide uppercase flex-none" style={{ background: sv.bg, color: sv.color }}>
                        {iss.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="bg-white border border-[var(--color-outline-variant)] rounded">
            <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>
              Dokumen — {docs.length}
            </div>
            <div className="p-4 flex flex-col gap-2">
              {docs.length === 0 ? (
                <div className="text-sm text-[var(--color-on-surface-variant)]">Belum ada dokumen</div>
              ) : (
                docs.map((d) => {
                  const st = DOC_STATUS_STYLE[d.status] ?? DOC_STATUS_STYLE.DRAFT;
                  return (
                    <div key={d.id} className="flex items-center justify-between gap-3 border border-[var(--color-surface-container-high)] rounded px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{d.file_name}</div>
                        <div className="text-xs text-[var(--color-on-surface-variant)]">
                          {d.category ?? "Other"} · {Math.max(1, Math.round(d.file_size / 1024))} KB · {d.uploader_name ?? "—"}
                        </div>
                      </div>
                      <span className="flex items-center gap-2 flex-none">
                        <DocumentStatus documentId={d.id} status={d.status} />
                        <span className="h-[22px] px-2 inline-flex items-center rounded text-xs font-semibold tracking-wide uppercase" style={{ background: st.bg, color: st.color }}>
                          {d.status}
                        </span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div id="update" className="grid md:grid-cols-2 gap-5">
            <FieldUpdateForm projectId={id} />
            <InlineCreate projectId={id} />
            <DocumentUpload projectId={id} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div
            className="rounded-lg p-[18px] border border-[var(--color-outline-variant)] border-l-[3px] border-l-[var(--color-primary)] shadow-[0_4px_8px_rgba(23,29,28,0.04)]"
            style={{ background: "linear-gradient(180deg, #f0fbfa 0%, #ffffff 70%)" }}
          >
            <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-primary)]">Analisis Otomatis</div>
            <div className="mt-3 text-[15px] leading-6">{insight}</div>
            <div className="mt-3.5 flex flex-col gap-2">
              {actions.map((a, i) => (
                <div key={i} className="flex gap-2 items-start text-sm leading-[22px] text-[var(--color-on-surface-variant)]">
                  <span className="text-[var(--color-primary)] font-bold">›</span>{a}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[var(--color-outline-variant)] rounded">
            <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Informasi Proyek</div>
            <div className="px-4 py-1">
              {[
                ["Kode", project.project_code],
                ["Manager", project.manager_name ?? "—"],
                ["Lokasi", project.location_text ?? "—"],
                ["Mulai", project.start_date ?? "—"],
                ["Target selesai", project.planned_end_date ?? "—"],
                ["Status", PROJECT_STATUS_LABEL[project.status] ?? project.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-[var(--color-surface-container-low)] last:border-0">
                  <div className="text-sm text-[var(--color-outline)]">{k}</div>
                  <div className="text-sm font-medium text-right">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[var(--color-outline-variant)] rounded">
            <div className="px-4 py-3.5 border-b border-[var(--color-outline-variant)] font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Log Aktivitas</div>
            <div className="p-4">
              {logs.length === 0 ? (
                <div className="text-sm text-[var(--color-on-surface-variant)]">Belum ada aktivitas tercatat.</div>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="grid grid-cols-[14px_1fr] gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{l.action.replace(/_/g, " ")}</div>
                      <div className="font-mono text-xs text-[var(--color-data-mono)]">{new Date(l.created_at).toLocaleString("id-ID")}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
