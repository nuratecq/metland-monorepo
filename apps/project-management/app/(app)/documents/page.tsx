import { getDb } from "@/lib/turso";
import { FileText, FileSpreadsheet, Image, File, Files } from "lucide-react";

export const dynamic = "force-dynamic";

type Doc = {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  category: string | null;
  status: string;
  version: number;
  uploaded_at: string;
  project_name: string | null;
  uploader_name: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:        { label: "Draft",        color: "#64748b", bg: "#f1f5f9" },
  UNDER_REVIEW: { label: "Under Review", color: "#d97706", bg: "#fef3c7" },
  APPROVED:     { label: "Approved",     color: "#16a34a", bg: "#f0fdf4" },
  REJECTED:     { label: "Rejected",     color: "#dc2626", bg: "#fef2f2" },
  ARCHIVED:     { label: "Archived",     color: "#6b7280", bg: "#f9fafb" },
};

function fileIcon(mime: string) {
  if (mime === "application/pdf")
    return <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><FileText size={15} className="text-red-500" /></div>;
  if (mime.includes("word") || mime.includes("document"))
    return <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><FileText size={15} className="text-blue-500" /></div>;
  if (mime.includes("excel") || mime.includes("spreadsheet") || mime.includes("csv"))
    return <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0"><FileSpreadsheet size={15} className="text-green-600" /></div>;
  if (mime.startsWith("image/"))
    return <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0"><Image size={15} className="text-purple-500" /></div>;
  return <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0"><File size={15} className="text-gray-400" /></div>;
}

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";

  const db = getDb();
  let docs: Doc[] = [];

  try {
    let sql = `
      SELECT d.id, d.file_name, d.mime_type, d.file_size, d.category, d.status,
             d.version, d.uploaded_at,
             p.name AS project_name,
             u.name AS uploader_name
      FROM documents d
      LEFT JOIN projects p ON p.id = d.entity_id AND d.entity_type = 'project'
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE 1=1
    `;
    const args: string[] = [];
    if (q) {
      sql += " AND (d.file_name LIKE ? OR d.category LIKE ? OR p.name LIKE ?)";
      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY d.uploaded_at DESC LIMIT 100";
    const rs = await db.execute({ sql, args: args as never[] });
    docs = (rs.rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ""),
      file_name: String(r.file_name ?? ""),
      mime_type: String(r.mime_type ?? ""),
      file_size: Number(r.file_size ?? 0),
      category: r.category != null ? String(r.category) : null,
      status: String(r.status ?? "DRAFT"),
      version: Number(r.version ?? 1),
      uploaded_at: String(r.uploaded_at ?? ""),
      project_name: r.project_name != null ? String(r.project_name) : null,
      uploader_name: r.uploader_name != null ? String(r.uploader_name) : null,
    }));
  } catch {}

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Documents</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">{docs.length} dokumen</p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-outline-variant)] flex items-center gap-3">
          <form method="GET" className="flex-1">
            <input
              name="q"
              defaultValue={q}
              type="text"
              placeholder="Cari dokumen, kategori, atau proyek…"
              className="w-full h-9 px-3 bg-[var(--color-surface-container-low)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] placeholder:text-[var(--color-on-surface-variant)]"
            />
          </form>
        </div>

        {/* Table */}
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-on-surface-variant)]">
            <Files size={36} className="opacity-30 mb-3" />
            <p className="text-sm font-medium">Belum ada dokumen.</p>
            <p className="text-xs mt-1 opacity-60">Upload via POST /api/projects/:id/documents</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)]">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[120px]">Category</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[160px]">Project</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[110px]">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[130px]">Uploaded</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--color-on-surface-variant)] w-[80px]">Size</th>
                <th className="w-[40px]" />
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => {
                const st = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.DRAFT;
                return (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--color-outline-variant)] last:border-0 hover:bg-[var(--color-surface-container-low)] transition-colors cursor-default"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {fileIcon(d.mime_type)}
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--color-on-surface)] truncate max-w-[260px]">{d.file_name}</div>
                          {d.uploader_name && (
                            <div className="text-[11px] text-[var(--color-on-surface-variant)]">{d.uploader_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3 text-[13px] text-[var(--color-on-surface-variant)]">
                      {d.category ?? <span className="text-[var(--color-outline)]">—</span>}
                    </td>
                    {/* Project */}
                    <td className="px-4 py-3 text-[13px] text-[var(--color-on-surface-variant)] truncate max-w-[160px]">
                      {d.project_name ?? <span className="text-[var(--color-outline)]">—</span>}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex h-[20px] items-center px-2 rounded text-[11px] font-semibold"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-[12px] font-mono text-[var(--color-on-surface-variant)]">
                      {d.uploaded_at ? formatDate(d.uploaded_at) : "—"}
                    </td>
                    {/* Size */}
                    <td className="px-4 py-3 text-[12px] font-mono text-[var(--color-on-surface-variant)]">
                      {formatSize(d.file_size)}
                    </td>
                    {/* Actions placeholder */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-[var(--color-on-surface-variant)] opacity-40 text-sm">···</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
