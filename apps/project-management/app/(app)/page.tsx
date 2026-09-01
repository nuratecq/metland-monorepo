import { KpiTile } from "@metland/ui";
import { Card, CardContent, CardHeader } from "@metland/ui";
import { Badge } from "@metland/ui";
import { HealthMeter } from "@metland/ui";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Dashboard</h1>
        <p className="text-sm text-[var(--color-on-surface-variant)]">Operational overview — Plan → Execute → Monitor → Report</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Total Projects" value="—" sub="Turso not connected" />
        <KpiTile label="Active" value="—" />
        <KpiTile label="Delayed" value="—" />
        <KpiTile label="At Risk" value="—" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="font-semibold">Project Health</CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span>Project A — On Track</span><Badge status="success">On Track</Badge></div>
            <HealthMeter value={75} health="GREEN" />
            <div className="flex items-center justify-between text-sm"><span>Project B — At Risk</span><Badge status="warning">At Risk</Badge></div>
            <HealthMeter value={45} health="YELLOW" />
            <div className="flex items-center justify-between text-sm"><span>Project C — Delayed</span><Badge status="critical">Delayed</Badge></div>
            <HealthMeter value={20} health="RED" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="font-semibold">Phase 0 — Foundation</CardHeader>
          <CardContent className="text-sm text-[var(--color-on-surface-variant)] space-y-2">
            <p>✅ Design tokens + Tailwind + Fonts (Hanken/Inter/JetBrains)</p>
            <p>✅ Packages: db, auth, r2, audit, validators, ui</p>
            <p>✅ Sidebar/Topbar + base layout</p>
            <p>⏳ Turso provisioning → run <code className="font-mono bg-[var(--color-surface-container)] px-1">pnpm --filter @metland/db migrate</code></p>
            <p>⏳ Auth pages + middleware</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
