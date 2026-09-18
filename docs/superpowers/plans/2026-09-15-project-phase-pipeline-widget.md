# Project Phase Pipeline Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hardcoded 4-phase pipeline widget above the KPI grid on the project detail page to show where a project currently stands in its lifecycle.

**Architecture:** Create a pure server component `ProjectPhasePipeline` that accepts the existing milestones array (already fetched in the page), maps each milestone by sort index to one of four hardcoded phases (Feasibility Study → Quantity Surveyor → Design Plan → Construction), and derives each phase's status from the milestone's `status` field. No DB changes. Insert the component in `projects/[id]/page.tsx` between the header/actions row and the KPI grid.

**Tech Stack:** Next.js 15 App Router, React Server Component, Tailwind CSS v4, existing design-system CSS variables (`--color-primary`, `--color-status-green`, `--color-error`, `--color-outline-variant`, `--color-outline`), Lucide icons.

**Spec:** `docs/superpowers/plans/2026-09-15-project-phase-pipeline-widget.md` (this file)

## Global Constraints

- No new DB queries — reuse the `milestones` array already fetched in the page.
- No client components (`"use client"`) — pure RSC.
- Use existing CSS design tokens from `packages/design-system/src/css-variables.css`; no raw hex values.
- Phases are hardcoded in source — no DB table or config file.
- Pipeline must not cause horizontal scroll on mobile; use responsive wrap grid below 768px.
- Icons from `lucide-react` only (no emoji).
- Tailwind v4 inline style syntax: use `style={{ ... }}` for CSS variable color values, Tailwind classes for layout/spacing.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/project-management/components/projects/ProjectPhasePipeline.tsx` | **Create** | Hardcoded phase definitions, status derivation logic, pipeline UI |
| `apps/project-management/app/(app)/projects/[id]/page.tsx` | **Modify** | Import + render `<ProjectPhasePipeline>` above the KPI grid |

---

### Task 1: Create `ProjectPhasePipeline` component

**Files:**
- Create: `apps/project-management/components/projects/ProjectPhasePipeline.tsx`

**Interfaces:**
- Consumes: `milestones: Array<{ status: string; completion_percentage: number; name: string }>` — already typed in the page as `Milestone[]` (the subset used here)
- Produces: default export `ProjectPhasePipeline` React component (RSC, no `"use client"`)

---

- [ ] **Step 1: Create the file with hardcoded phase definitions and status map**

```tsx
// apps/project-management/components/projects/ProjectPhasePipeline.tsx
import { Check, Clock, AlertCircle, Circle } from "lucide-react";

const PHASES = [
  { id: "feasibility", label: "Feasibility Study" },
  { id: "quantity-surveyor", label: "Quantity Surveyor" },
  { id: "design-plan", label: "Design Plan" },
  { id: "construction", label: "Construction" },
] as const;

type PhaseStatus = "DONE" | "IN_PROGRESS" | "BLOCKED" | "TODO";

type MilestoneLike = {
  status: string;
  completion_percentage: number;
  name: string;
};

function deriveStatus(milestone: MilestoneLike | undefined): PhaseStatus {
  if (!milestone) return "TODO";
  const s = milestone.status as PhaseStatus;
  if (s === "DONE" || s === "IN_PROGRESS" || s === "BLOCKED") return s;
  return "TODO";
}

const STATUS_CONFIG: Record<
  PhaseStatus,
  {
    dotColor: string;
    borderColor: string;
    bgColor: string;
    textColor: string;
    labelText: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  DONE: {
    dotColor: "var(--color-status-green)",
    borderColor: "var(--color-status-green)",
    bgColor: "#f0fdf4",
    textColor: "var(--color-status-green)",
    labelText: "Selesai",
    Icon: Check,
  },
  IN_PROGRESS: {
    dotColor: "var(--color-primary)",
    borderColor: "var(--color-primary)",
    bgColor: "#f0fbfa",
    textColor: "var(--color-primary)",
    labelText: "Berjalan",
    Icon: Clock,
  },
  BLOCKED: {
    dotColor: "var(--color-error)",
    borderColor: "var(--color-error)",
    bgColor: "#fef2f2",
    textColor: "var(--color-error)",
    labelText: "Terblokir",
    Icon: AlertCircle,
  },
  TODO: {
    dotColor: "var(--color-outline-variant)",
    borderColor: "var(--color-outline-variant)",
    bgColor: "#ffffff",
    textColor: "var(--color-outline)",
    labelText: "Belum mulai",
    Icon: Circle,
  },
};
```

- [ ] **Step 2: Write the component render function in the same file**

Append below the constants:

```tsx
export default function ProjectPhasePipeline({
  milestones,
}: {
  milestones: MilestoneLike[];
}) {
  return (
    <div className="bg-white border border-[var(--color-outline-variant)] rounded">
      <div
        className="px-4 py-3 border-b border-[var(--color-outline-variant)] text-xs font-semibold tracking-wide uppercase"
        style={{ color: "var(--color-outline)" }}
      >
        Status Progress Project
      </div>

      {/* Pipeline row — wraps to 2-col grid on mobile to prevent horizontal scroll */}
      <div className="p-4 grid grid-cols-2 md:flex md:items-stretch gap-3">
        {PHASES.map((phase, idx) => {
          const milestone = milestones[idx];
          const status = deriveStatus(milestone);
          const cfg = STATUS_CONFIG[status];
          const pct = milestone?.completion_percentage ?? 0;
          const isActive = status === "IN_PROGRESS";

          return (
            <div key={phase.id} className="md:flex md:items-stretch md:flex-1 gap-0">
              {/* Phase card */}
              <div
                className="flex-1 rounded border-2 px-3 py-3 flex flex-col gap-1.5 relative transition-all"
                style={{
                  borderColor: cfg.borderColor,
                  backgroundColor: cfg.bgColor,
                  boxShadow: isActive
                    ? `0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent)`
                    : undefined,
                }}
              >
                {/* Phase number + status icon */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold tracking-wider uppercase"
                    style={{ color: "var(--color-outline)" }}
                  >
                    Fase {idx + 1}
                  </span>
                  <cfg.Icon
                    size={14}
                    style={{ color: cfg.dotColor }}
                  />
                </div>

                {/* Phase name */}
                <div
                  className="text-sm font-semibold leading-snug"
                  style={{ fontFamily: "var(--font-hanken)", color: "var(--color-on-surface)" }}
                >
                  {phase.label}
                </div>

                {/* Status label */}
                <div
                  className="text-[11px] font-medium"
                  style={{ color: cfg.textColor }}
                >
                  {cfg.labelText}
                </div>

                {/* Progress bar */}
                <div className="mt-1 h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: cfg.dotColor,
                    }}
                  />
                </div>

                {/* Percentage */}
                <div
                  className="text-[11px] font-mono"
                  style={{ color: "var(--color-data-mono)" }}
                >
                  {pct}%
                </div>

                {/* Active pulse dot */}
                {isActive && (
                  <span
                    className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                )}
              </div>

              {/* Connector arrow — hidden after last item, hidden on mobile */}
              {idx < PHASES.length - 1 && (
                <div className="hidden md:flex items-center px-1 flex-none">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 10h8M10 6l4 4-4 4"
                      stroke="var(--color-outline-variant)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the file compiles — no TS errors expected**

Run from monorepo root:
```bash
cd apps/project-management && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors referencing `ProjectPhasePipeline.tsx`.

---

### Task 2: Wire `ProjectPhasePipeline` into the project detail page

**Files:**
- Modify: `apps/project-management/app/(app)/projects/[id]/page.tsx:92–153` (the JSX return)

**Interfaces:**
- Consumes: `ProjectPhasePipeline` default export from `@/components/projects/ProjectPhasePipeline`
- Consumes: `milestones: Milestone[]` — already in scope from the existing DB query (line ~44)

The existing `Milestone` type is:
```ts
type Milestone = { id: string; name: string; completion_percentage: number; status: string; due_date: string | null };
```
`ProjectPhasePipeline` expects `{ status: string; completion_percentage: number; name: string }[]` — this is a structural subset, so passing `milestones` directly is valid.

---

- [ ] **Step 1: Add the import at the top of `page.tsx`**

In `apps/project-management/app/(app)/projects/[id]/page.tsx`, after the existing imports, add:

```tsx
import { ProjectPhasePipeline } from "@/components/projects/ProjectPhasePipeline";
```

> Note: The component uses `export default`, so change the import to:
> ```tsx
> import ProjectPhasePipeline from "@/components/projects/ProjectPhasePipeline";
> ```

- [ ] **Step 2: Insert the widget above the KPI grid**

Locate the KPI grid block (currently starting around line 131):
```tsx
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
```

Insert `<ProjectPhasePipeline milestones={milestones} />` immediately before it:

```tsx
      <ProjectPhasePipeline milestones={milestones} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* ... existing KPI tiles ... */}
      </div>
```

- [ ] **Step 3: Run type-check to confirm no errors**

```bash
cd apps/project-management && npx tsc --noEmit 2>&1 | head -30
```
Expected: clean.

- [ ] **Step 4: Start dev server and visually verify**

```bash
pnpm --filter project-management dev
```

Open `http://localhost:3000/projects/<any-id>`. Verify:
1. Pipeline widget appears above the Progress / Kesehatan / Task Terlambat / Hari ke Tenggat grid.
2. Phases map correctly: Milestone 1 → Feasibility Study, Milestone 2 → Quantity Surveyor, etc.
3. `IN_PROGRESS` milestone shows teal border + pulse dot.
4. `DONE` milestone shows green border + check icon.
5. Phases with no matching milestone show gray/muted state.
6. No horizontal scroll on narrow viewport (test at 375px width).
7. Mobile: 2-column grid (no overflow).

- [ ] **Step 5: Commit**

```bash
git add apps/project-management/components/projects/ProjectPhasePipeline.tsx \
        apps/project-management/app/\(app\)/projects/\[id\]/page.tsx
git commit -m "feat: add phase pipeline widget above KPI grid on project detail page"
```

---

## Self-Review

**Spec coverage:**
- [x] Hardcoded 4 phases (Feasibility Study → Quantity Surveyor → Design Plan → Construction)
- [x] Pipeline shape with connectors
- [x] Active phase highlighted (teal border + ring + pulse dot)
- [x] Placed above KPI grid
- [x] No DB changes
- [x] Derives state from existing milestones array

**Placeholder scan:** None found — all code is complete.

**Type consistency:**
- `MilestoneLike` type in component matches subset of `Milestone` type in page — structural compatibility confirmed.
- `STATUS_CONFIG` keys exactly match `PhaseStatus` union — exhaustive.
- `PHASES` length = 4; connector renders for `idx < 3` — correct.

**Responsive check:** `grid grid-cols-2 md:flex` — 2-col on mobile, flex row on ≥768px. No horizontal scroll on mobile. UX guideline satisfied.
