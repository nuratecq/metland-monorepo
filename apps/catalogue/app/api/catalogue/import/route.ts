import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { randomUUID } from "crypto";

/** Import Excel MVP docs/PRD.md:979 — supports JSON rows + multipart Excel via exceljs */
export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    // Excel upload branch — parse via exceljs if available
    try {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
      const buf = Buffer.from(await file.arrayBuffer());
      const ExcelJS = await import("exceljs").then(m=> (m as unknown as { default: typeof import("exceljs") }).default ?? m).catch(()=>null);
      if (!ExcelJS) return NextResponse.json({ error: "exceljs not installed" }, { status: 500 });
      const wb = new (ExcelJS as unknown as { Workbook: new()=>{ xlsx: { load:(b:Buffer)=>Promise<void> }; getWorksheet:(n:number)=>{ getRow:(n:number)=>{ values: unknown[] }; rowCount:number } } }).Workbook();
      await wb.xlsx.load(buf);
      const ws = wb.getWorksheet(1);
      if (!ws) return NextResponse.json({ error: "empty sheet" }, { status: 400 });
      const headers = (ws.getRow(1).values as unknown[]).slice(1).map(v=> String(v ?? "").trim());
      const rows: Record<string,string>[] = [];
      for (let i=2;i<=ws.rowCount;i++){ const vals=(ws.getRow(i).values as unknown[]).slice(1); const rec:Record<string,string>={}; headers.forEach((h,idx)=> rec[h]=String(vals[idx] ?? "")); if (Object.values(rec).some(v=>v)) rows.push(rec); }
      // reuse JSON path
      const fakeReq = { json: async()=>({ type:"contractor", rows, mapping: {} }) } as unknown as NextRequest;
      // fallthrough to JSON logic with rows extracted
      const body2 = { type:"contractor", rows } as unknown as Record<string,unknown>;
      // inline validation same as JSON flow
      const db2 = getDb();
      const mRows = rows;
      const errors:unknown[]=[]; const toInsert: {company_name:string;company_code:string;location?:string}[]=[]; const seen=new Set<string>();
      for(let i=0;i<mRows.length;i++){ const r=mRows[i]; const cn=String(r["company_name"] ?? r["Company Name"] ?? "").trim(); const cc=String(r["company_code"] ?? r["Company Code"] ?? "").trim(); if(!cn) errors.push({row:i+1,error:"Missing company_name"}); else if(!cc) errors.push({row:i+1,error:"Missing company_code"}); else if(seen.has(cc)) errors.push({row:i+1,error:`Duplicate ${cc}`}); else { const ex=await db2.execute({sql:"SELECT id FROM contractors WHERE company_code=?",args:[cc]}); if(ex.rows.length) errors.push({row:i+1,error:`Duplicate in DB ${cc}`}); else{ seen.add(cc); toInsert.push({company_name:cn,company_code:cc,location:String(r["location"] ?? "")}); } } }
      if (form.get("preview")) return NextResponse.json({ preview: toInsert.slice(0,5), errors, total: mRows.length, valid: toInsert.length, mode:"excel" });
      let inserted=0; for(const rec of toInsert){ try{ await db2.execute({sql:`INSERT INTO contractors (id, company_name, company_code, location, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,args:[randomUUID(), rec.company_name, rec.company_code, rec.location||null, new Date().toISOString(), new Date().toISOString()]}); inserted++; }catch(e){ errors.push({error:String(e)});} }
      return NextResponse.json({ inserted, errors, mode:"excel" });
    } catch(e){ return NextResponse.json({ error: String(e) }, { status: 500 }); }
  }
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
