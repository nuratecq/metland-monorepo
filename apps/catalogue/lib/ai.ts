/** AI Service docs/PRD.md:1015 — structured query + ranking + guardrail */

export type Intent = {
  specialization?: string; // Structure, MEP, Civil...
  category?: string;
  location?: string;
  project_type?: string; // High-Rise, Township, Hotel
  keywords: string[];
};

const SPEC_KEYWORDS: Record<string, string[]> = {
  Structure: ["struktur", "structure", "high rise", "high-rise", "beton", "precast", "tower"],
  MEP: ["mep", "electrical", "plumbing", "ac", "hvac"],
  Civil: ["civil", "sipil", "jalan", "road"],
  Foundation: ["foundation", "pondasi", "bore pile"],
  Infrastructure: ["infrastructure", "infrastruktur", "jembatan", "bridge", "toll"],
  Road: ["road", "jalan"],
  Architecture: ["architecture", "arsitektur"],
};

export function extractIntent(query: string): Intent {
  const q = query.toLowerCase();
  let spec: string | undefined;
  for (const [k, words] of Object.entries(SPEC_KEYWORDS)) {
    if (words.some((w) => q.includes(w))) { spec = k; break; }
  }
  let project_type: string | undefined;
  if (q.includes("high rise") || q.includes("high-rise") || q.includes("tower") || q.includes("apartemen")) project_type = "High-Rise";
  else if (q.includes("township") || q.includes("cibitung") || q.includes("menteng")) project_type = "Township";
  else if (q.includes("mall")) project_type = "Mall";
  else if (q.includes("hotel")) project_type = "Hotel";

  let location: string | undefined;
  if (q.includes("bekasi")) location = "Bekasi";
  else if (q.includes("jakarta")) location = "Jakarta";
  else if (q.includes("tangerang")) location = "Tangerang";

  return { specialization: spec, project_type, location, keywords: q.split(/\s+/).filter(Boolean).slice(0, 10) };
}

export type Candidate = {
  id: string;
  company_name: string;
  company_code: string;
  description: string | null;
  location: string | null;
  spec_name: string | null;
  category_name: string | null;
  portfolios?: { project_name: string; project_type: string | null }[];
};

export function rankCandidates(candidates: Candidate[], intent: Intent): { candidate: Candidate; score: number; reasons: string[] }[] {
  return candidates.map((c) => {
    let score = 0;
    const reasons: string[] = [];
    if (intent.specialization && c.spec_name === intent.specialization) { score += 40; reasons.push("✓ Relevant specialization"); }
    if (intent.location && c.location?.toLowerCase().includes(intent.location.toLowerCase())) { score += 20; reasons.push("✓ Location compatible"); }
    // portfolio match
    const hasPortfolio = c.portfolios?.some((p) => intent.project_type ? p.project_type === intent.project_type : true);
    if (hasPortfolio) { score += 25; reasons.push("✓ Similar project experience"); }
    if (c.portfolios?.length) { score += 10; reasons.push("✓ Relevant portfolio"); }
    // keyword in description
    if (intent.keywords.some((k) => c.description?.toLowerCase().includes(k))) { score += 5; reasons.push("✓ Description match"); }
    if (score === 0) { score = 10; reasons.push("✓ Available catalogue entry"); }
    return { candidate: c, score, reasons };
  }).sort((a, b) => b.score - a.score);
}

// Optional LLM provider docs/PRD.md:1015 — any OpenAI-compatible endpoint (the
// host is env-driven, it was hardcoded to api.openai.com). No key = deterministic
// template explanations, which is a supported mode, not a failure.

/** Epoch ms until which the provider is known-unavailable. The gateway returns
 * 429 {code:"model_cooldown", reset_seconds:N} when its upstream credentials are
 * cooling down; without this every ai-search would keep paying that round trip
 * to learn the same thing. Module-level, so it resets on redeploy.
 * ponytail: per-process, good enough for one instance — move to the DB or a
 * shared cache if this ever runs multi-instance. */
let cooldownUntil = 0;

export async function tryLLMExplanation(prompt: string): Promise<string | null> {
  const key = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (Date.now() < cooldownUntil) return null;

  const host = (process.env.LLM_HOST ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  try {
    // Timeout because this sits in the ai-search request path — a slow provider
    // must degrade to the template, never hang the page. Measured p50 ~2s with
    // spikes past 8s on this gateway.
    const res = await fetch(`${host}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      // stream:false is explicit — some gateways stream by default, and an SSE
      // body would not parse as JSON here.
      body: JSON.stringify({ model, stream: false, max_tokens: 200, messages: [{ role: "system", content: "Jawaban hanya dari data catalogue, jangan halusinasi docs/PRD.md:917" }, { role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(Number(process.env.LLM_TIMEOUT_MS ?? 15000)),
    });
    if (!res.ok) {
      if (res.status === 429) {
        const secs = await res.json().then((b: unknown) => Number((b as { error?: { reset_seconds?: number } })?.error?.reset_seconds)).catch(() => NaN);
        cooldownUntil = Date.now() + (Number.isFinite(secs) && secs > 0 ? secs : 60) * 1000;
      }
      return null;
    }
    const j = await res.json() as unknown as { choices?: { message?: { content?: string } }[] };
    const text = j.choices?.[0]?.message?.content?.trim();
    return text ? text : null;
  } catch { return null; }
}

// Guardrail explanation — only facts from candidate, no hallucination docs/PRD.md:917
export function buildExplanation(ranked: { candidate: Candidate; score: number; reasons: string[] }, intent: Intent): string {
  const c = ranked.candidate;
  const match = ranked.score >= 50 ? "High" : ranked.score >= 30 ? "Medium" : "Low";
  // template only from source data
  const portfolioStr = c.portfolios?.map((p) => p.project_name).slice(0, 2).join(", ") || "—";
  return `Match: ${match}. Recommended karena memiliki spesialisasi ${c.spec_name ?? "-"} ${intent.location ? `dan lokasi ${c.location}` : ""}. Portfolio: ${portfolioStr}. ${ranked.reasons.join(" ")}`;
}
