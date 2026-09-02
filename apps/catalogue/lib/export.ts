// ponytail: duplicated in apps/project-management/lib/export.ts — 40 lines beats a new
// workspace package for two call sites. Promote to @metland/export if a third appears.
import { NextResponse } from "next/server";

export type Sheet = { name: string; rows: (string | number | null)[][] };

/** RFC 4180: a field containing a quote, comma, or newline must be quoted and its quotes doubled. */
function csvCell(v: string | number | null): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /["\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(sheets: Sheet[]): string {
  return sheets
    .map((s) => [`# ${s.name}`, ...s.rows.map((r) => r.map(csvCell).join(","))].join("\n"))
    .join("\n\n");
}

export function csvResponse(sheets: Sheet[], filename: string): NextResponse {
  return new NextResponse(toCsv(sheets), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}

export async function xlsxResponse(sheets: Sheet[], filename: string): Promise<NextResponse> {
  const ExcelJS = await import("exceljs")
    .then((m) => (m as unknown as { default: typeof import("exceljs") }).default ?? m)
    .catch(() => null);
  if (!ExcelJS) return NextResponse.json({ error: "exceljs not installed" }, { status: 500 });

  const wb = new ExcelJS.Workbook();
  for (const s of sheets) {
    // Excel rejects sheet names over 31 chars or containing []*/\?:
    const ws = wb.addWorksheet(s.name.replace(/[[\]*/\\?:]/g, "-").slice(0, 31));
    s.rows.forEach((r) => ws.addRow(r));
    if (s.rows.length) ws.getRow(1).font = { bold: true };
  }
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
