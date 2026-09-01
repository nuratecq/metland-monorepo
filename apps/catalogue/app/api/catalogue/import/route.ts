import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { randomUUID } from "crypto";

/** Import Excel MVP docs/PRD.md:979 — JSON mapping flow for now (Upload->Mapping->Validation->Preview->Import) */
export async function POST(req: NextRequest) {
  const body = await req.json();
  // body: { type: 'contractor'|'material', rows: Array<Record<string,string>>, mapping: Record<string,string> }
  const type = body.type ?? "contractor";
  const rows: Record<string, string>[] = body.rows ?? [];
  const mapping: Record<string, string> = body.mapping ?? {}; // csvHeader -> dbField

  if (!rows.length) return NextResponse.json({ error: "rows required" }, { status: 400 });

  const db = getDb();
  const errors: unknown[] = [];
  const toInsert: { company_name: string; company_code: string; location?: string }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    // map via mapping or direct
    const get = (field: string) => {
      const header = Object.keys(mapping).find((k) => mapping[k] === field) ?? field;
      return r[header] ?? r[field] ?? "";
    };
    const company_name = String(get("company_name") ?? "").trim();
    const company_code = String(get("company_code") ?? "").trim();
    const location = String(get("location") ?? "").trim();
    if (!company_name) errors.push({ row: i + 1, error: "Missing company_name" });
    else if (!company_code) errors.push({ row: i + 1, error: "Missing company_code" });
    else if (seen.has(company_code)) errors.push({ row: i + 1, error: `Duplicate code ${company_code}` });
    else {
      // check DB duplicate
      const exist = await db.execute({ sql: "SELECT id FROM contractors WHERE company_code = ?", args: [company_code] });
      if (exist.rows.length) errors.push({ row: i + 1, error: `Duplicate in DB ${company_code}` });
      else {
        seen.add(company_code);
        toInsert.push({ company_name, company_code, location });
      }
    }
  }

  if (body.preview) {
    return NextResponse.json({ preview: toInsert.slice(0, 5), errors, total: rows.length, valid: toInsert.length });
  }

  // import
  let inserted = 0;
  for (const rec of toInsert) {
    try {
      await db.execute({
        sql: `INSERT INTO contractors (id, company_name, company_code, location, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        args: [randomUUID(), rec.company_name, rec.company_code, rec.location || null, new Date().toISOString(), new Date().toISOString()],
      });
      inserted++;
    } catch (e) {
      errors.push({ error: String(e), rec });
    }
  }

  const msg = type === "contractor" ? `Inserted ${inserted} contractors` : `Inserted ${inserted}`;
  return NextResponse.json({ inserted, errors, message: msg });
}
