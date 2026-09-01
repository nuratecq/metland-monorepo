import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/turso";
import { extractIntent, rankCandidates, buildExplanation } from "@/lib/ai";
import { randomUUID } from "crypto";

/**
 * POST /api/catalogue/ai-search
 * Body: { query: string }
 * Flow docs/PRD.md:868 — Intent → Search → Filtering → Candidate Retrieval → Ranking → Recommendation → Explanation
 * Guardrail docs/PRD.md:917 — no hallucination, all facts from catalogue
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const query: string = String(body.query ?? "").trim();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const intent = extractIntent(query);
  const db = getDb();

  // Candidate retrieval via repository (not direct LLM DB access docs/PRD.md:1013)
  let sql = "SELECT c.id, c.company_name, c.company_code, c.description, c.location, cs.name as spec_name, cc.name as category_name FROM contractors c LEFT JOIN contractor_specializations cs ON cs.id=c.specialization_id LEFT JOIN contractor_categories cc ON cc.id=c.category_id WHERE 1=1";
  const args: unknown[] = [];
  // filtering by intent (structured query)
  if (intent.specialization) { sql += " AND cs.name = ?"; args.push(intent.specialization); }
  if (intent.location) { sql += " AND c.location LIKE ?"; args.push(`%${intent.location}%`); }
  sql += " LIMIT 20";
  const rs = await db.execute({ sql, args: args as never[] });
  let candidates = rs.rows as unknown as { id: string; company_name: string; company_code: string; description: string | null; location: string | null; spec_name: string | null; category_name: string | null }[];

  // if filtered too narrow, fallback to LIKE on description
  if (candidates.length === 0) {
    const fb = await db.execute({ sql: "SELECT c.id, c.company_name, c.company_code, c.description, c.location, cs.name as spec_name, cc.name as category_name FROM contractors c LEFT JOIN contractor_specializations cs ON cs.id=c.specialization_id LEFT JOIN contractor_categories cc ON cc.id=c.category_id WHERE c.company_name LIKE ? OR c.description LIKE ? LIMIT 10", args: [`%${intent.keywords[0] ?? ""}%`, `%${intent.keywords[0] ?? ""}%`] });
    candidates = fb.rows as never;
  }

  // attach portfolios for ranking context
  const withPortfolios = await Promise.all(candidates.map(async (c) => {
    const pf = await db.execute({ sql: "SELECT project_name, project_type FROM contractor_portfolios WHERE contractor_id = ? LIMIT 5", args: [c.id] });
    return { ...c, portfolios: pf.rows as unknown as { project_name: string; project_type: string | null }[] };
  }));

  const ranked = rankCandidates(withPortfolios as never, intent).slice(0, 5);
  // try LLM for top 1 if configured, fallback template guardrail
  const llmTop = await (async()=>{ try{ const { tryLLMExplanation } = await import("@/lib/ai"); const prompt = `Query: ${query}\nTop candidate: ${ranked[0]?.candidate.company_name ?? ""} ${ranked[0]?.candidate.description ?? ""} — explain why recommended in 1 sentence from data only`; return await tryLLMExplanation(prompt); } catch { return null; } })();
  const recommendations = ranked.map((r, idx) => ({
    contractor: r.candidate,
    score: r.score,
    match: r.score >= 50 ? "High" : r.score >= 30 ? "Medium" : "Low",
    reasons: r.reasons,
    explanation: idx===0 && llmTop ? llmTop : buildExplanation(r as never, intent),
  }));

  // persist recommendation record for approval flow docs/PRD.md:944
  const recId = randomUUID();
  try {
    await db.execute({
      sql: `INSERT INTO recommendations (id, query, query_intent, results, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [recId, query, JSON.stringify(intent), JSON.stringify(recommendations.map(r=>({ id: r.contractor.id, score: r.score }))), new Date().toISOString()],
    });
  } catch {}

  return NextResponse.json({ query, intent, recommendations, recommendation_id: recId });
}
