import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader, Badge } from "@metland/ui";
export const dynamic = "force-dynamic";
export default async function DocumentsPage(){
  const db=getDb();
  let docs:unknown[]=[];
  try{ const rs=await db.execute("SELECT d.*, p.name as project_name FROM documents d LEFT JOIN projects p ON p.id=d.entity_id WHERE d.entity_type='project' ORDER BY d.uploaded_at DESC LIMIT 30"); docs=rs.rows;}catch{}
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{fontFamily:"var(--font-hanken)"}}>Documents</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">Category docs/PRD.md:546 + status DRAFT→APPROVED docs/PRD.md:573 — R2 presign via /api/r2/presign</p>
      <Card><CardHeader className="font-semibold">Project Documents</CardHeader><CardContent className="space-y-2 text-sm">
        {docs.length===0? <span className="text-[var(--color-on-surface-variant)]">No documents — POST /api/projects/:id/documents with r2_key</span> : docs.map((r:unknown)=>{const d=r as Record<string,unknown>; return <div key={String(d.id)} className="border rounded p-2 flex justify-between"><span>{String(d.file_name)} <span className="text-xs">({String(d.category)})</span> — {String(d.project_name ?? "")}</span><Badge status={String(d.status)==="APPROVED"?"success":String(d.status)==="REJECTED"?"critical":"neutral"}>{String(d.status)}</Badge></div>;})}
      </CardContent></Card>
    </div>
  );
}
