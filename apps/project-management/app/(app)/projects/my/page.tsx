import { getDb } from "@/lib/turso";
import { Card, CardContent } from "@metland/ui";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function MyProjectsPage() {
  const db = getDb();
  let data: unknown[] = [];
  try { const rs=await db.execute("SELECT * FROM projects WHERE status IN ('ACTIVE','PLANNED') ORDER BY updated_at DESC LIMIT 20"); data=rs.rows; } catch {}
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-hanken)" }}>My Projects</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">Filtered by membership — MVP shows ACTIVE/PLANNED (object-level auth header x-user-id future)</p>
      <div className="grid gap-3">{data.map((r:unknown)=>{const p=r as Record<string,unknown>; return <Link key={String(p.id)} href={`/projects/${String(p.id)}`}><Card><CardContent className="p-4"><div className="font-semibold">{String(p.name)}</div><div className="font-mono text-xs">{String(p.project_code)}</div></CardContent></Card></Link>;})}</div>
    </div>
  );
}
