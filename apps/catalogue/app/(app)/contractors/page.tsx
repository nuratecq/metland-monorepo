import { getDb } from "@/lib/turso";
import { Card, CardContent } from "@metland/ui";
import Link from "next/link";
export const dynamic = "force-dynamic";

export default async function ContractorsPage() {
  const db = getDb();
  let data: unknown[] = [];
  try { const rs = await db.execute("SELECT c.*, cc.name as category_name FROM contractors c LEFT JOIN contractor_categories cc ON cc.id=c.category_id ORDER BY c.created_at DESC LIMIT 30"); data = rs.rows; } catch {}
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Contractors</h1>
        <Link href="/import" className="border rounded px-3 py-1 text-sm">Import Excel</Link>
      </div>
      <div className="flex gap-2 text-sm">
        <Link href="/contractors" className="px-3 py-1 bg-white border rounded">All</Link>
        <Link href="/contractors?category=Structure" className="px-3 py-1 bg-white border rounded">Structure</Link>
        <Link href="/search" className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">Search</Link>
      </div>
      {data.length===0 ? <Card><CardContent className="p-8 text-center text-[var(--color-on-surface-variant)]">No contractors — POST /api/catalogue/contractors or Import.</CardContent></Card> :
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{data.map((r:unknown)=>{const c=r as Record<string,unknown>; return <Link key={String(c.id)} href={`/contractors/${String(c.id)}`}><Card className="hover:border-[var(--color-primary)] transition-colors border-l-4 border-l-white hover:border-l-[var(--color-primary)]"><CardContent className="p-4"><div className="font-semibold">{String(c.company_name)}</div><div className="text-xs font-mono text-[var(--color-data-mono)]">{String(c.company_code)}</div><div className="text-xs mt-1">{String(c.location ?? "")} {String(c.category_name ?? "") ? `• ${String(c.category_name)}` : ""}</div></CardContent></Card></Link>;})}</div>
      }
    </div>
  );
}
