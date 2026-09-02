import { NextRequest, NextResponse } from "next/server";
import { csvResponse, xlsxResponse } from "@/lib/export";
import { asDate, dashboardReport, dashboardSheets, projectSheets, projectSummary } from "@/lib/reports";

/** Reports docs/PRD.md:653 — Project Summary + Dashboard Report, period filter, JSON/CSV/Excel. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";
  const projectId = searchParams.get("project_id");
  const period = { from: asDate(searchParams.get("from")), to: asDate(searchParams.get("to")) };

  if (projectId) {
    const data = await projectSummary(projectId, period);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (format === "json") return NextResponse.json({ data });
    const file = `report-${data.project.project_code}`;
    return format === "xlsx" ? xlsxResponse(projectSheets(data), file) : csvResponse(projectSheets(data), file);
  }

  const data = await dashboardReport(period);
  if (format === "json") return NextResponse.json({ data });
  return format === "xlsx"
    ? xlsxResponse(dashboardSheets(data), "dashboard-report")
    : csvResponse(dashboardSheets(data), "dashboard-report");
}
