import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    message?: string;
    projectCtx?: string;
    dateRange?: string;
  };

  const message = String(body.message ?? "").trim();
  if (!message) return NextResponse.json({ text: "Pesan tidak boleh kosong." });

  const db = getDb();

  // Fetch PM context data
  const dateFilter = (() => {
    switch (body.dateRange) {
      case "7d": return "AND (t.created_at >= date('now', '-7 days') OR t.updated_at >= date('now', '-7 days'))";
      case "30d": return "AND (t.created_at >= date('now', '-30 days') OR t.updated_at >= date('now', '-30 days'))";
      case "90d": return "AND (t.created_at >= date('now', '-90 days') OR t.updated_at >= date('now', '-90 days'))";
      default: return "";
    }
  })();

  const [projectsRs, tasksRs, workloadRs, overdueRs] = await Promise.all([
    db.execute(
      `SELECT p.id, p.name, p.project_code, p.progress, p.health_status,
              p.location_text,
              COUNT(t.id) as task_count,
              SUM(CASE WHEN t.status='DONE' THEN 1 ELSE 0 END) as done_count,
              SUM(CASE WHEN t.due_date < date('now') AND t.status NOT IN ('DONE','CANCELLED') THEN 1 ELSE 0 END) as overdue_count
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id
       ORDER BY p.progress DESC
       LIMIT 20`
    ).catch(() => ({ rows: [] })),

    db.execute(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.progress,
              u.name as assignee_name, p.name as project_name, p.id as project_id
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE 1=1 ${dateFilter}
       ORDER BY t.created_at DESC
       LIMIT 100`
    ).catch(() => ({ rows: [] })),

    db.execute(
      `SELECT u.name, u.id,
              COUNT(t.id) as total_tasks,
              SUM(CASE WHEN t.status='IN_PROGRESS' THEN 1 ELSE 0 END) as active_tasks,
              SUM(CASE WHEN t.due_date < date('now') AND t.status NOT IN ('DONE','CANCELLED') THEN 1 ELSE 0 END) as overdue_tasks
       FROM users u
       LEFT JOIN tasks t ON t.assignee_id = u.id
       WHERE u.id IS NOT NULL
       GROUP BY u.id
       ORDER BY total_tasks DESC
       LIMIT 20`
    ).catch(() => ({ rows: [] })),

    db.execute(
      `SELECT t.id, t.title, t.due_date, t.priority, t.status,
              u.name as assignee_name, p.name as project_name, p.id as project_id
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.due_date < date('now') AND t.status NOT IN ('DONE','CANCELLED')
       ORDER BY t.due_date ASC
       LIMIT 30`
    ).catch(() => ({ rows: [] })),
  ]);

  type ProjectRow = { id: string; name: string; project_code: string; progress: number; health_status: string; location_text: string; task_count: number; done_count: number; overdue_count: number };
  type TaskRow = { id: string; title: string; status: string; priority: string; due_date: string; progress: number; assignee_name: string; project_name: string; project_id: string };
  type WorkloadRow = { name: string; id: string; total_tasks: number; active_tasks: number; overdue_tasks: number };
  type OverdueRow = { id: string; title: string; due_date: string; priority: string; status: string; assignee_name: string; project_name: string; project_id: string };

  const projects = projectsRs.rows as unknown as ProjectRow[];
  const tasks = tasksRs.rows as unknown as TaskRow[];
  const workload = workloadRs.rows as unknown as WorkloadRow[];
  const overdueTasks = overdueRs.rows as unknown as OverdueRow[];

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;

  const contextData = `
PROJECTS (${projects.length} total):
${projects.map((p) => `- [${p.project_code}] ${p.name}: ${p.progress}% progress, health=${p.health_status}, tasks=${p.task_count}, done=${p.done_count}, overdue=${p.overdue_count}`).join("\n")}

TASK SUMMARY (last ${body.dateRange ?? "all time"}):
- Total: ${totalTasks}
- Done: ${doneTasks}
- In Progress: ${inProgressTasks}
- Blocked: ${blockedTasks}
- Overdue: ${overdueTasks.length}

OVERDUE TASKS (${overdueTasks.length}):
${overdueTasks.slice(0, 15).map((t) => `- "${t.title}" in ${t.project_name} | due: ${t.due_date} | priority: ${t.priority} | assigned: ${t.assignee_name ?? "unassigned"}`).join("\n")}

TEAM WORKLOAD:
${workload.map((w) => `- ${w.name}: ${w.total_tasks} total, ${w.active_tasks} active, ${w.overdue_tasks} overdue`).join("\n")}
`.trim();

  // If no API key configured, return helpful stub
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      text: "AI Assistant belum dikonfigurasi. Tambahkan ANTHROPIC_API_KEY ke file .env untuk mengaktifkan fitur ini.\n\nData proyek berhasil dimuat: " + projects.length + " proyek, " + totalTasks + " task, " + overdueTasks.length + " overdue.",
      cards: [
        { type: "kpi", label: "Total Proyek", value: projects.length, color: "primary" },
        { type: "kpi", label: "Total Task", value: totalTasks, color: "primary" },
        { type: "kpi", label: "Overdue", value: overdueTasks.length, color: overdueTasks.length > 0 ? "red" : "green" },
        { type: "kpi", label: "In Progress", value: inProgressTasks, color: "blue" },
      ],
      actions: [{ label: "View Projects", href: "/projects" }],
      meta: `Based on ${totalTasks} tasks across ${projects.length} projects.`,
    });
  }

  const systemPrompt = `You are an AI Project Management Intelligence Assistant for Metland's construction project management system.

You have access to real-time project and task data. Analyze the data and provide intelligent, actionable PM insights.

IMPORTANT: Always respond with ONLY valid JSON — no markdown, no code blocks, just raw JSON.

JSON format:
{
  "text": "Your main response text. Be concise, professional, and action-oriented. Match the user's language (Indonesian if they write Indonesian, English if English). Include WHY + IMPACT + RECOMMENDATION when analyzing risks.",
  "cards": [],
  "actions": [],
  "meta": null
}

Card types (include only when they add value):
- KPI: {"type":"kpi","label":"...","value":"...","subtext":"...","color":"primary|green|yellow|red|blue"}
- Risk: {"type":"risk","project":"...","progress":75,"due_date":"2025-01-15","risk_level":"HIGH|MEDIUM|LOW","reason":"..."}
- Insight: {"type":"insight","variant":"risk|recommendation|deadline|bottleneck|trend","title":"...","body":"..."}
- Table: {"type":"table","headers":["Col1","Col2"],"rows":[["val1","val2"]]}

Actions format: {"label":"View Tasks","href":"/projects/[project_id]/tasks"}
Use real project IDs from the data below when constructing href values.

Rules:
- Keep "text" concise (2-5 sentences max for simple queries, longer for complex analysis)
- Only include cards when they improve understanding
- Max 4 KPI cards, max 5 risk/insight cards
- Include "meta" with data scope ("Based on X tasks across Y active projects")
- Never expose raw SQL or technical implementation details
- For risk analysis: always explain WHY the project is at risk, what the IMPACT is, and RECOMMENDATION

CURRENT PROJECT DATA:
${contextData}`;

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("Claude API error:", aiRes.status, errText);
      return NextResponse.json({
        text: "Terjadi kesalahan saat menghubungi AI. Coba lagi dalam beberapa saat.",
        isError: true,
      });
    }

    const aiData = await aiRes.json();
    const rawText = aiData?.content?.[0]?.text ?? "";

    // Parse JSON from Claude
    let parsed: { text: string; cards?: unknown[]; actions?: unknown[]; meta?: string } = { text: rawText };
    try {
      // Strip any accidental markdown code fences
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, return raw text
      parsed = { text: rawText };
    }

    return NextResponse.json({
      text: parsed.text ?? rawText,
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      meta: parsed.meta ?? null,
    });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json({
      text: "Terjadi kesalahan saat menganalisis data proyek.",
      isError: true,
    });
  }
}
