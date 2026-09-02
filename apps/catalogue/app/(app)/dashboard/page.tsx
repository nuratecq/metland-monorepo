import { Card, CardContent, CardHeader, Badge } from "@metland/ui";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>AI Catalogue</h1>
        <p className="text-sm text-[var(--color-on-surface-variant)]">Discovery — Search → Discover → Compare → Recommend → Approve</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="font-semibold">Contractors</CardHeader>
          <CardContent className="text-2xl font-bold">—</CardContent>
        </Card>
        <Card>
          <CardHeader className="font-semibold">Materials</CardHeader>
          <CardContent className="text-2xl font-bold">—</CardContent>
        </Card>
        <Card>
          <CardHeader className="font-semibold">Recommendations</CardHeader>
          <CardContent className="text-2xl font-bold">—</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <span className="font-semibold">AI Search</span>
          <Badge status="info">Phase 4</Badge>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-on-surface-variant)]">
          Contoh: “Cari kontraktor struktur untuk proyek high rise” — pipeline Intent → Retrieval → Ranking → Explanation (guardrail anti-halusinasi).
        </CardContent>
      </Card>
    </div>
  );
}
