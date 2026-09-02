import { NextRequest, NextResponse } from "next/server";
import { csvResponse, xlsxResponse } from "@/lib/export";
import { asDate, catalogueReport, catalogueSheets } from "@/lib/reports";

/** Catalogue reporting — JSON/CSV/Excel with an optional reporting period. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";
  const data = await catalogueReport({
    from: asDate(searchParams.get("from")),
    to: asDate(searchParams.get("to")),
  });

  if (format === "json") return NextResponse.json({ data });
  return format === "xlsx"
    ? xlsxResponse(catalogueSheets(data), "catalogue-report")
    : csvResponse(catalogueSheets(data), "catalogue-report");
}
