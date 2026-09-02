import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader } from "@metland/ui";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function ContractorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  let c: Record<string,unknown> | null = null;
  try { const rs=await db.execute({sql:"SELECT c.*, cc.name as category_name, cs.name as spec_name FROM contractors c LEFT JOIN contractor_categories cc ON cc.id=c.category_id LEFT JOIN contractor_specializations cs ON cs.id=c.specialization_id WHERE c.id=?",args:[id]}); c=rs.rows[0] as unknown as Record<string,unknown>; } catch {}
  if (!c) return notFound();
  const portfolios = await db.execute({sql:"SELECT * FROM contractor_portfolios WHERE contractor_id=? ORDER BY year DESC",args:[id]}).catch(()=>({rows:[]} as never));
  return (
    <div className="space-y-4">
      <div>
        <div className="font-mono text-xs text-[var(--color-data-mono)]">{String(c.company_code)}</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-hanken)" }}>{String(c.company_name)}</h1>
        <div className="text-sm text-[var(--color-on-surface-variant)]">{String(c.location ?? "")} {String(c.category_name ?? "") ? `• ${String(c.category_name)}` : ""} {String(c.spec_name ?? "") ? `• ${String(c.spec_name)}` : ""}</div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card><CardHeader className="font-semibold">Profile</CardHeader><CardContent className="text-sm space-y-1"><div>Contact: {String(c.contact_name ?? "-")} {String(c.contact_email ?? "")}</div><div>Certification: {String(c.certification ?? "-")}</div><div>Status: {String(c.status)}</div></CardContent></Card>
        <Card><CardHeader className="font-semibold">Portfolio — {portfolios.rows.length}</CardHeader><CardContent className="space-y-2 text-sm">{portfolios.rows.length===0? <span className="text-[var(--color-on-surface-variant)]">No portfolio — used as AI context</span> : portfolios.rows.map((p:unknown)=>{const pp=p as Record<string,unknown>; return <div key={String(pp.id)} className="border rounded p-2"><div className="font-medium">{String(pp.project_name)}</div><div className="text-xs">{String(pp.client ?? "")} • {String(pp.location ?? "")} • {String(pp.year ?? "")}</div></div>;})}</CardContent></Card>
      </div>
    </div>
  );
}
