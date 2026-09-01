import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const categories = ["Structure", "MEP", "Civil", "Architecture", "Foundation", "Road", "Infrastructure"];
const specs = ["High-Rise", "Township", "Mall", "Hotel", "Hospital", "Industrial"];
const contractors = [
  { name: "PT Wijaya Karya Beton", code: "WIKA-001", spec: "Structure", loc: "Jakarta", desc: "Spesialis struktur high-rise & precast, portfolio M Gold Tower & Kaliana", portfolio: [{ project: "M Gold Tower Bekasi", client: "Metland", type: "High-Rise", year: 2022 }, { project: "Kaliana Apartment", client: "Metland", type: "High-Rise", year: 2023 }] },
  { name: "PT Adhi Persada Gedung", code: "ADHI-002", spec: "Structure", loc: "Bekasi", desc: "High-rise & infrastructure, pengalaman township 200+ unit", portfolio: [{ project: "Metland Cibitung Phase 2", client: "Metland", type: "Township", year: 2023 }] },
  { name: "PT Total Bangun Persada", code: "TOTAL-003", spec: "Structure", loc: "Jakarta", desc: "Kontraktor gedung bertingkat & mall", portfolio: [{ project: "Grand Metropolitan Expansion", client: "Metland", type: "Mall", year: 2024 }] },
  { name: "PT Jaya Konstruksi", code: "JAYA-004", spec: "Road", loc: "Bekasi", desc: "Road & infrastructure, jembatan CBL Cibitung-Cikarang", portfolio: [{ project: "Jembatan CBL", client: "Metland", type: "Infrastructure", year: 2024 }] },
  { name: "PT Nindya Karya", code: "NINDYA-005", spec: "Infrastructure", loc: "Bandung", desc: "Infrastruktur & hospitality — Smara Hotel Kertajati", portfolio: [{ project: "Metland Smara Kertajati", client: "Metland", type: "Hotel", year: 2021 }] },
  { name: "PT PP Properti", code: "PP-006", spec: "Civil", loc: "Cikarang", desc: "Civil & township eco-living", portfolio: [{ project: "Metland Cikarang Weston", client: "Metland", type: "Township", year: 2024 }] },
  { name: "PT Brantas Abipraya", code: "BRANTAS-007", spec: "Foundation", loc: "Surabaya", desc: "Foundation & dam, specialized bore pile", portfolio: [{ project: "Metland Menteng Foundation", client: "Metland", type: "Township", year: 2022 }] },
  { name: "PT Hutama Karya", code: "HK-008", spec: "Infrastructure", loc: "Jakarta", desc: "BUMN infrastructure, toll & township", portfolio: [{ project: "Metland Kertajati Access Road", client: "Metland", type: "Infrastructure", year: 2024 }] },
];

const materials = [
  { name: "Ready Mix K-350", category: "Concrete", brand: "Holcim", unit: "m3", price: 1150000, supplier: "PT Holcim" },
  { name: "Baja Tulangan D16", category: "Steel", brand: "Krakatau Steel", unit: "ton", price: 13500000, supplier: "PT Krakatau" },
  { name: "Keramik 60x60 White", category: "Finishing", brand: "Roman", unit: "m2", price: 185000, supplier: "PT Roman" },
  { name: "AC Split 2PK", category: "MEP", brand: "Daikin", unit: "unit", price: 7500000, supplier: "PT Daikin" },
  { name: "Panel Surya 550Wp", category: "MEP", brand: "Trina", unit: "unit", price: 3200000, supplier: "PT Trina" },
];

async function main() {
  const url = process.env.TURSO_CATALOGUE_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_CATALOGUE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO URL missing");
  const db = createClient({ url, authToken: token });
  const { catalogueSchemaSql } = await import("./catalogue.js");
  for (const stmt of catalogueSchemaSql.split(";").map(s => s.trim()).filter(Boolean)) await db.execute(stmt);
  console.log("[seed-catalogue] schema ensured");

  for (const c of categories) {
    await db.execute({ sql: "INSERT OR IGNORE INTO contractor_categories (id, name) VALUES (?, ?)", args: [randomUUID(), c] });
  }
  for (const s of specs) {
    await db.execute({ sql: "INSERT OR IGNORE INTO contractor_specializations (id, name) VALUES (?, ?)", args: [randomUUID(), s] });
  }
  for (const s of ["Concrete","Steel","Finishing","MEP"]) {
    await db.execute({ sql: "INSERT OR IGNORE INTO material_categories (id, name) VALUES (?, ?)", args: [randomUUID(), s] });
  }

  const catMap = new Map<string,string>();
  for (const row of (await db.execute("SELECT id, name FROM contractor_categories")).rows as unknown as {id:string,name:string}[]) catMap.set(row.name, row.id);
  const specMap = new Map<string,string>();
  for (const row of (await db.execute("SELECT id, name FROM contractor_specializations")).rows as unknown as {id:string,name:string}[]) specMap.set(row.name, row.id);
  const matCatMap = new Map<string,string>();
  for (const row of (await db.execute("SELECT id, name FROM material_categories")).rows as unknown as {id:string,name:string}[]) matCatMap.set(row.name, row.id);

  for (const ct of contractors) {
    const exist = await db.execute({ sql: "SELECT id FROM contractors WHERE company_code = ?", args: [ct.code] });
    let cid: string;
    if (exist.rows.length) {
      cid = String((exist.rows[0] as unknown as Record<string,string>).id);
      console.log(`[seed-catalogue] exists ${ct.code}`);
    } else {
      cid = randomUUID();
      await db.execute({
        sql: `INSERT INTO contractors (id, company_name, company_code, description, category_id, specialization_id, location, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        args: [cid, ct.name, ct.code, ct.desc, catMap.get(ct.spec) ?? null, specMap.get(ct.spec) ?? null, ct.loc, new Date().toISOString(), new Date().toISOString()],
      });
      console.log(`[seed-catalogue] inserted ${ct.code}`);
    }
    for (const pf of ct.portfolio) {
      const pe = await db.execute({ sql: "SELECT id FROM contractor_portfolios WHERE contractor_id=? AND project_name=?", args: [cid, pf.project] });
      if (pe.rows.length) continue;
      await db.execute({
        sql: `INSERT INTO contractor_portfolios (id, contractor_id, project_name, client, project_type, year, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [randomUUID(), cid, pf.project, pf.client, pf.type, pf.year, pf.project],
      });
    }
  }

  for (const m of materials) {
    const exist = await db.execute({ sql: "SELECT id FROM materials WHERE name=? AND brand=?", args: [m.name, m.brand] });
    if (exist.rows.length) continue;
    await db.execute({
      sql: `INSERT INTO materials (id, name, category_id, brand, unit, price, supplier_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      args: [randomUUID(), m.name, matCatMap.get(m.category) ?? null, m.brand, m.unit, m.price, null, new Date().toISOString(), new Date().toISOString()],
    });
    console.log(`[seed-catalogue] material ${m.name}`);
  }

  const cc = await db.execute("SELECT COUNT(*) as cnt FROM contractors");
  console.log("[seed-catalogue] contractors", cc.rows[0].cnt);
  const mc = await db.execute("SELECT COUNT(*) as cnt FROM materials");
  console.log("[seed-catalogue] materials", mc.rows[0].cnt);
}

main().catch(e=>{console.error(e); process.exit(1);});
