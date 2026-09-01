import { getDb } from "@/lib/turso";
import { Card, CardContent } from "@metland/ui";
export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const db = getDb();
  let data: unknown[] = [];
  try { const rs=await db.execute("SELECT m.*, mc.name as category_name FROM materials m LEFT JOIN material_categories mc ON mc.id=m.category_id ORDER BY m.created_at DESC LIMIT 30"); data=rs.rows;} catch {}
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-hanken)" }}>Materials</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {data.length===0 ? <Card><CardContent className="p-8 text-sm text-[var(--color-on-surface-variant)]">No materials — POST /api/catalogue/materials</CardContent></Card> :
          data.map((r:unknown)=>{const m=r as Record<string,unknown>; return <Card key={String(m.id)}><CardContent className="p-4"><div className="font-semibold">{String(m.name)}</div><div className="text-xs">{String(m.category_name ?? "")} {String(m.brand ?? "") ? `• ${String(m.brand)}` : ""}</div><div className="text-xs text-[var(--color-on-surface-variant)]">{String(m.unit ?? "")} {m.price ? `• Rp ${String(m.price)}` : ""}</div></CardContent></Card>;})}
      </div>
    </div>
  );
}
