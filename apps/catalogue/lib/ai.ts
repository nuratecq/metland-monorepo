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

// Guardrail explanation — only facts from candidate, no hallucination docs/PRD.md:917
export function buildExplanation(ranked: { candidate: Candidate; score: number; reasons: string[] }, intent: Intent): string {
  const c = ranked.candidate;
  const match = ranked.score >= 50 ? "High" : ranked.score >= 30 ? "Medium" : "Low";
  // template only from source data
  const portfolioStr = c.portfolios?.map((p) => p.project_name).slice(0, 2).join(", ") || "—";
  return `Match: ${match}. Recommended karena memiliki spesialisasi ${c.spec_name ?? "-"} ${intent.location ? `dan lokasi ${c.location}` : ""}. Portfolio: ${portfolioStr}. ${ranked.reasons.join(" ")}`;
}
