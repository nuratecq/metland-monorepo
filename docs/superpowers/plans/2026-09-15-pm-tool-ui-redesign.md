# PM Tool UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Metland PM shell (Sidebar, Topbar), Dashboard, and Projects list to match the visual language of the Donezo reference dashboard — clean sections, teal left-accent active state, filled primary hero KPI tile, search bar in topbar, and better chart layout.

**Architecture:** Five targeted file edits touching the layout shell, one shared component (KpiTile), and two pages (Dashboard, Projects). Every edit is purely visual — no DB queries change, no routes change, no business logic changes. Task 3 (KpiTile variant) is a dependency for Tasks 4 and 5; all others are independent.

**Tech Stack:** Next.js 15 App Router, React Server Components, Tailwind CSS v4, `@metland/ui` component package, Lucide React icons, CSS design tokens from `packages/design-system/src/css-variables.css`.

**Spec:** `PRODUCT.md` + reference image at `c:\Users\argfh\Downloads\new.png` (Donezo PM dashboard — used as design language reference, not pixel copy).

## Global Constraints

- No new DB queries and no changes to existing queries — reuse all data already fetched.
- Tailwind CSS v4: use `style={{ ... }}` for CSS variable color values; `className` for layout/spacing. Never use raw hex colors — all colors via CSS variables.
- Lucide React only for icons. Import by exact named export. No emoji.
- `"use client"` only on files where it already exists or where `useState`/`usePathname` is required.
- TypeScript strict: no `any` unless already present in the file.
- All 59 Vitest tests must remain green. Run `pnpm test` after each task.
- TypeScript must compile clean: `pnpm --filter project-management build` (or `cd apps/project-management && npx tsc --noEmit`).
- CSS variables used in this plan: `--color-primary` (#006767), `--color-surface-container-low`, `--color-surface-container`, `--color-outline`, `--color-outline-variant`, `--color-on-surface`, `--color-on-surface-variant`, `--color-status-red`, `--color-status-yellow`, `--color-status-green`, `--font-hanken`.
- Preserve ALL existing `isActive()` logic in Sidebar exactly — only visual classes change.
- Do not remove AppSwitcher from Topbar — keep it, just relocate and restyle.
- KpiTile `variant` prop defaults to `"default"` — existing callers with no `variant` prop are unaffected.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/project-management/components/layout/Sidebar.tsx` | **Modify** | Nav section grouping (MENU/GENERAL), left-accent active state, Tasks nav item |
| `apps/project-management/components/layout/Topbar.tsx` | **Modify** | Search form, AppSwitcher right-side, user name display, remove Approvals/Reports quick links |
| `packages/ui/src/components/kpi-tile.tsx` | **Modify** | Add `variant?: "default" \| "filled"` prop — filled = teal background + white text |
| `apps/project-management/app/(app)/dashboard/page.tsx` | **Modify** | 4 KPI tiles (first filled), header action button, 2/3+1/3 chart layout |
| `apps/project-management/app/(app)/projects/page.tsx` | **Modify** | First KPI tile filled, consistent pattern with dashboard |

---

### Task 1: Sidebar — section labels + left-accent active state

**Files:**
- Modify: `apps/project-management/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: updated `Sidebar` component (same props: `{ user?, perms? }`) — other files import this unchanged

**What changes:**
1. Split flat `nav` array into `navSections` structure with `label` + `items`
2. Add Tasks (`/tasks`) to MENU group, with icon `ClipboardList`
3. Active state: replace `bg-[var(--color-secondary-container)]` with `bg-[var(--color-surface-container-low)] text-[var(--color-primary)]` + `boxShadow: "inset 3px 0 0 var(--color-primary)"` (CSS inset shadow acts as left accent border without disrupting padding)
4. Add section label `<div>` above each group ("MENU", "GENERAL", "ADMINISTRATION")
5. Extract `NavLink` helper component to avoid repeating the className logic

---

- [ ] **Step 1: Replace the file contents**

Write the complete new `Sidebar.tsx`:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FolderHeart,
  Archive,
  CalendarDays,
  Files,
  BarChart3,
  Bell,
  ShieldCheck,
  Bot,
  Users,
  ClipboardList,
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/projects", label: "All Projects", icon: FolderKanban },
      { href: "/projects/my", label: "My Projects", icon: FolderHeart },
      { href: "/projects/archive", label: "Archive", icon: Archive },
      { href: "/tasks", label: "Tasks", icon: ClipboardList },
      { href: "/schedule", label: "Schedule", icon: CalendarDays },
    ],
  },
  {
    label: "General",
    items: [
      { href: "/employees", label: "Employees", icon: Users },
      { href: "/documents", label: "Documents", icon: Files },
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/approvals", label: "Approvals", icon: ShieldCheck },
      { href: "/ai", label: "AI Assistant", icon: Bot },
    ],
  },
];

const adminItems = [
  { href: "/admin/users", label: "Users", perm: "user.manage" },
  { href: "/admin/roles", label: "Roles", perm: "user.manage" },
  { href: "/admin/audit", label: "Audit Trail", perm: "audit.read" },
];

function reportPeriod() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(first)} – ${fmt(last)}`;
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 h-[38px] px-3 rounded text-sm transition-colors ${
        active
          ? "bg-[var(--color-surface-container-low)] text-[var(--color-primary)] font-semibold"
          : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]"
      }`}
      style={active ? { boxShadow: "inset 3px 0 0 var(--color-primary)" } : undefined}
    >
      <Icon size={16} className="shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar({
  user,
  perms = [],
}: {
  user?: { name: string; role: string };
  perms?: string[];
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/projects") return pathname === "/projects";
    if (href === "/projects/my") {
      if (pathname.startsWith("/projects/my")) return true;
      if (["/projects/archive", "/projects/new"].some((s) => pathname.startsWith(s)))
        return false;
      return pathname.startsWith("/projects/");
    }
    return pathname.startsWith(href);
  };

  const visibleAdmin = adminItems.filter(
    (a) => perms.includes("*") || perms.includes(a.perm)
  );

  const initials = (user?.name ?? "PM")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="w-[244px] shrink-0 border-r border-[var(--color-outline-variant)] bg-white hidden md:flex flex-col">
      {/* Logo */}
      <div
        className="h-16 flex items-center gap-2 px-5 border-b border-[var(--color-outline-variant)]"
        style={{ fontFamily: "var(--font-hanken)" }}
      >
        <Image
          src="/logo.png"
          alt="Metland"
          width={104}
          height={18}
          priority
          className="h-[18px] w-auto"
        />
        <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">PM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {navSections.map((section, si) => (
          <div key={section.label}>
            <div
              className="mb-1 px-3 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-outline)" }}
            >
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((n) => (
                <NavLink key={n.href} {...n} active={isActive(n.href)} />
              ))}
            </div>
          </div>
        ))}

        {visibleAdmin.length > 0 && (
          <div className="pt-4 border-t border-[var(--color-outline-variant)]">
            <div
              className="mb-1 px-3 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-outline)" }}
            >
              Administration
            </div>
            <div className="space-y-0.5">
              {visibleAdmin.map((a) => (
                <NavLink
                  key={a.href}
                  href={a.href}
                  label={a.label}
                  icon={ShieldCheck}
                  active={isActive(a.href)}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Report period card */}
      <div className="m-3 p-3.5 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]">
        <div
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "var(--color-outline)" }}
        >
          Periode laporan
        </div>
        <div
          className="mt-1 font-mono text-[13px]"
          style={{ color: "var(--color-on-surface)" }}
        >
          {reportPeriod()}
        </div>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-[var(--color-outline-variant)] flex items-center gap-2.5">
        <div
          className="w-[34px] h-[34px] rounded-full text-white flex items-center justify-center text-[13px] font-semibold flex-none"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div
            className="text-[13px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: "var(--color-on-surface)" }}
          >
            {user?.name ?? "Pengguna"}
          </div>
          <div className="text-xs" style={{ color: "var(--color-outline)" }}>
            {user?.role ?? "Project Manager"}
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/project-management && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. If `ClipboardList` is not found, check lucide-react version: `npx lucide-react --version`. Alternative icons: `SquareCheckBig`, `ListTodo`, `CheckSquare`.

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: 59 tests pass, 0 failures.

- [ ] **Step 4: Commit**

```bash
git add apps/project-management/components/layout/Sidebar.tsx
git commit -m "feat: redesign sidebar with nav sections and left-accent active state"
```

---

### Task 2: Topbar — search form + user name display

**Files:**
- Modify: `apps/project-management/components/layout/Topbar.tsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: updated `Topbar` component (same props: `{ user? }`) — `layout.tsx` imports it unchanged
- `AppSwitcher` stays imported and rendered — do not remove it

**What changes:**
1. Add `Search` icon import from `lucide-react`
2. Add `<form action="/projects" method="GET">` search input on the left — plain HTML form, no JS needed, submits to projects page with `?q=` query param
3. Remove "SINKRON BARU SAJA" synced badge
4. Remove `<Link href="/approvals">` and `<Link href="/reports">` quick links (both are now in sidebar GENERAL section)
5. Add user name + role text next to avatar (hidden on small screens with `hidden lg:block`)
6. Move `AppSwitcher` to right side, between Bell and user avatar

---

- [ ] **Step 1: Replace the file contents**

```tsx
import Link from "next/link";
import { AppSwitcher } from "./AppSwitcher";
import { Bell, Search } from "lucide-react";

export function Topbar({ user }: { user?: { name: string } }) {
  const initials = (user?.name ?? "PM")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 border-b border-[var(--color-outline-variant)] bg-white flex items-center px-4 gap-4">
      {/* Search — submits to /projects?q=... */}
      <form
        action="/projects"
        method="GET"
        className="flex items-center gap-2 h-9 w-60 shrink-0 rounded-lg px-3 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]"
      >
        <Search
          size={14}
          className="shrink-0"
          style={{ color: "var(--color-outline)" }}
        />
        <input
          name="q"
          type="search"
          placeholder="Cari proyek..."
          className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-[var(--color-outline)]"
          style={{ color: "var(--color-on-surface)" }}
        />
        <kbd
          className="text-[10px] font-mono px-1.5 py-0.5 rounded leading-none shrink-0"
          style={{
            backgroundColor: "var(--color-surface-container)",
            color: "var(--color-outline)",
          }}
        >
          ⌘K
        </kbd>
      </form>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <AppSwitcher />

        <Link
          href="/notifications"
          className="p-1.5 rounded hover:bg-[var(--color-surface-container)] transition-colors"
        >
          <Bell size={18} style={{ color: "var(--color-on-surface-variant)" }} />
        </Link>

        <div className="flex items-center gap-2">
          <div className="text-right hidden lg:block">
            <div
              className="text-[13px] font-semibold leading-none"
              style={{ color: "var(--color-on-surface)" }}
            >
              {user?.name ?? "Pengguna"}
            </div>
            <div
              className="text-[11px] mt-0.5 leading-none"
              style={{ color: "var(--color-outline)" }}
            >
              PM Metland
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-full text-white grid place-items-center text-sm font-semibold shrink-0"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/project-management && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: 59 tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/project-management/components/layout/Topbar.tsx
git commit -m "feat: redesign topbar with search form and user name display"
```

---

### Task 3: KpiTile — add `filled` variant

**Files:**
- Modify: `packages/ui/src/components/kpi-tile.tsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: `KpiTile` component with new optional `variant?: "default" | "filled"` prop.
  - Default prop value: `"default"` — all existing callers pass no `variant` prop and continue to render exactly as before.
  - When `variant="filled"`: teal background (`var(--color-primary)`), white text, white/70 label and sub text.

**IMPORTANT:** The existing render path (no `variant` or `variant="default"`) must not change at all. This is a pure additive change.

---

- [ ] **Step 1: Replace the file contents**

```tsx
import * as React from "react";

export function KpiTile({
  label,
  value,
  sub,
  className = "",
  variant = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
  variant?: "default" | "filled";
}) {
  if (variant === "filled") {
    return (
      <div
        className={`rounded-[var(--radius-lg)] p-4 ${className}`}
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <div
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {label}
        </div>
        <div
          className="mt-1 text-3xl font-bold tracking-tight text-white"
          style={{ fontFamily: "var(--font-hanken)" }}
        >
          {value}
        </div>
        {sub ? (
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {sub}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-4 ${className}`}
    >
      <div className="text-xs font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">
        {label}
      </div>
      <div
        className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
        style={{ fontFamily: "var(--font-hanken)" }}
      >
        {value}
      </div>
      {sub ? <div className="text-sm text-[var(--color-data-mono)]">{sub}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript from monorepo root**

```bash
cd apps/project-management && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. The existing callers of `KpiTile` with no `variant` prop compile without changes because `variant` defaults to `"default"`.

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: 59 tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/kpi-tile.tsx
git commit -m "feat: add filled variant to KpiTile for hero tile pattern"
```

---

### Task 4: Dashboard — 4 KPI tiles + header action + chart layout

**Files:**
- Modify: `apps/project-management/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `KpiTile` with `variant="filled"` from Task 3 — **Task 3 must be complete before this task**
- Consumes: existing imports (`Card`, `CardContent`, `CardHeader`, `Badge`, `HealthMeter`, `TaskPriorityDonut`, `ProjectStatusBar`, `TaskActivityLine`) — all unchanged
- Produces: nothing consumed by other tasks

**What changes:**
1. Import `Plus` from `lucide-react`; add `Link` to import (already imported for the KpiTile links — verify it's present)
2. Page header: add flex `justify-between` wrapper; add `<Link href="/projects/new">+ Proyek Baru</Link>` button on the right
3. KPI grid: reduce from 6 tiles to 4. Remove "Upcoming Milestones (14d)" and "Active Projects" tiles from the grid row. New order: Total Proyek (filled), Active Projects, Delayed (red border), At Risk (yellow border). Keep `variant="filled"` on first tile and `Link` wrappers on Total and Delayed.
4. Layout section: split into `grid lg:grid-cols-3 gap-4` — `TaskActivityLine` takes `lg:col-span-2`, Project Health card takes `1/3`
5. Bottom row: keep `grid lg:grid-cols-3 gap-4` for the three charts, with `TaskPriorityDonut`, `ProjectStatusBar`, and the Task Board card (the last card from old layout)

---

- [ ] **Step 1: Add `Plus` icon import**

At the top of `apps/project-management/app/(app)/dashboard/page.tsx`, the current imports are:

```tsx
import { KpiTile } from "@metland/ui";
import { Card, CardContent, CardHeader } from "@metland/ui";
import { Badge } from "@metland/ui";
import { HealthMeter } from "@metland/ui";
import Link from "next/link";
import { getDb } from "@/lib/turso";
import {
  TaskPriorityDonut,
  ProjectStatusBar,
  TaskActivityLine,
  type PriorityItem,
  type ProjectStatusItem,
  type DailyActivity,
} from "./charts";
```

Add `Plus` to a new lucide import line after the existing imports:

```tsx
import { Plus } from "lucide-react";
```

- [ ] **Step 2: Replace the `Dashboard` component return JSX**

Replace everything from `return (` to the closing `);` of the `Dashboard` function with:

```tsx
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>
            Dashboard
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Plan, prioritize, and monitor your projects.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="h-9 px-4 flex items-center gap-1.5 rounded text-sm font-semibold text-white shrink-0 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus size={15} />
          Proyek Baru
        </Link>
      </div>

      {/* KPI tiles — 4 tiles, first filled */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/projects" className="block">
          <KpiTile
            label="Total Proyek"
            value={kpi.total}
            sub={`${kpi.active} aktif`}
            variant="filled"
            className="cursor-pointer h-full"
          />
        </Link>
        <KpiTile label="Active Projects" value={kpi.active} sub="status ACTIVE" />
        <Link href="/projects" className="block">
          <KpiTile
            label="Delayed"
            value={kpi.delayed}
            sub="health RED"
            className="cursor-pointer hover:bg-[var(--color-surface-container-low)] transition-colors border-l-4 border-l-[var(--color-status-red)] h-full"
          />
        </Link>
        <KpiTile
          label="At Risk"
          value={kpi.atRisk}
          sub="health YELLOW"
          className="border-l-4 border-l-[var(--color-status-yellow)]"
        />
      </div>

      {/* Activity chart (2/3) + Project health (1/3) */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TaskActivityLine data={kpi.activityData} />
        </div>
        <Card>
          <CardHeader className="font-semibold">Kesehatan Proyek</CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>On Track</span>
              <Badge status="success">GREEN</Badge>
            </div>
            <HealthMeter
              value={kpi.total ? Math.round(((kpi.total - kpi.delayed - kpi.atRisk) / Math.max(1, kpi.total)) * 100) : 0}
              health="GREEN"
            />
            <div className="flex items-center justify-between text-sm">
              <span>At Risk</span>
              <Badge status="warning">YELLOW</Badge>
            </div>
            <HealthMeter
              value={kpi.total ? Math.round((kpi.atRisk / kpi.total) * 100) : 0}
              health="YELLOW"
            />
            <div className="flex items-center justify-between text-sm">
              <span>Delayed</span>
              <Badge status="critical">RED</Badge>
            </div>
            <HealthMeter
              value={kpi.total ? Math.round((kpi.delayed / kpi.total) * 100) : 0}
              health="RED"
            />
          </CardContent>
        </Card>
      </div>

      {/* Bottom charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <TaskPriorityDonut data={kpi.priorityData} />
        <ProjectStatusBar data={kpi.projectStatusData} />
        <Card>
          <CardHeader className="font-semibold flex items-center justify-between">
            <span>Task Board</span>
            <Link
              href="/tasks"
              className="text-xs font-normal hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Buka board →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {kpi.board.length === 0 ? (
              <p className="text-sm text-[var(--color-on-surface-variant)]">Belum ada task.</p>
            ) : (
              kpi.board.map((c) => (
                <div key={c.status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[var(--color-on-surface-variant)]">{c.label}</span>
                    <span
                      className="font-mono text-[13px]"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {c.count}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-surface-container)]">
                    <div
                      className={`h-1.5 rounded-full ${c.bar}`}
                      style={{
                        width: `${kpi.taskTotal ? Math.round((c.count / kpi.taskTotal) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/project-management && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. The `variant="filled"` prop is now valid because Task 3 added it to KpiTile.

- [ ] **Step 4: Run tests**

```bash
pnpm test
```

Expected: 59 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/project-management/app/\(app\)/dashboard/page.tsx
git commit -m "feat: redesign dashboard with 4 KPI tiles, filled hero tile, and 2/3+1/3 chart layout"
```

---

### Task 5: Projects page — filled hero KPI tile

**Files:**
- Modify: `apps/project-management/app/(app)/projects/page.tsx`

**Interfaces:**
- Consumes: `KpiTile` with `variant="filled"` from Task 3 — **Task 3 must be complete before this task**
- Produces: nothing consumed by other tasks

**What changes:**
Only the KPI grid section changes (lines 75–80). The first tile (`Total Proyek`) gets `variant="filled"`. The order of the colored-border tiles also reorders to: Total (filled) → On Track (green border) → At Risk (yellow border) → Delayed (red border). Page header and `ProjectViewToggle` / `ProjectFilters` are untouched.

---

- [ ] **Step 1: Replace the KPI grid block in `projects/page.tsx`**

Find this block (approximately lines 75–80):

```tsx
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile label="Total Proyek" value={kpi.total} />
        <KpiTile label="On Track" value={kpi.onTrack} className="border-l-4 border-l-[var(--color-status-green)]" />
        <KpiTile label="At Risk" value={kpi.atRisk} className="border-l-4 border-l-[var(--color-status-yellow)]" />
        <KpiTile label="Delayed" value={kpi.delayed} className="border-l-4 border-l-[var(--color-status-red)]" />
      </div>
```

Replace it with:

```tsx
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile label="Total Proyek" value={kpi.total} sub={`${kpi.onTrack} on track`} variant="filled" />
        <KpiTile label="On Track" value={kpi.onTrack} className="border-l-4 border-l-[var(--color-status-green)]" />
        <KpiTile label="At Risk" value={kpi.atRisk} sub="health YELLOW" className="border-l-4 border-l-[var(--color-status-yellow)]" />
        <KpiTile label="Delayed" value={kpi.delayed} sub="health RED" className="border-l-4 border-l-[var(--color-status-red)]" />
      </div>
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/project-management && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: 59 tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/project-management/app/\(app\)/projects/page.tsx
git commit -m "feat: apply filled hero KPI tile pattern to projects page"
```

---

## Self-Review

**1. Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|-----------|
| Clean app shell, persistent left sidebar | Task 1 |
| Compact top navigation | Task 2 |
| Left accent active indicator | Task 1 (inset box-shadow) |
| Nav section labels (MENU/GENERAL) | Task 1 |
| Hover transition 120–180ms | Task 1 (`transition-colors`) |
| Search in topbar | Task 2 |
| User identity area compact | Task 2 |
| KPI cards — first filled primary | Tasks 3+4+5 |
| Colored left borders for status KPIs | Tasks 4+5 |
| Action button in page header | Task 4 |
| Activity chart prominent placement | Task 4 |
| Project health card | Task 4 (unchanged content, better layout) |
| Avoid rainbow dashboard | Task 4 (only first tile filled; health uses semantic colors) |
| Tasks nav item accessible from sidebar | Task 1 |
| Preserve all routes and business logic | All tasks — no route or query changes |
| 59 tests stay green | Verified in each task |

**2. Placeholder scan:** No TBDs, no "add appropriate X" — all steps have actual code.

**3. Type consistency:**
- `variant?: "default" | "filled"` defined in Task 3, consumed with `variant="filled"` in Tasks 4 and 5 — matches.
- `NavLink` helper accepts `NavItem & { active: boolean }` — used consistently in Task 1.
- `KpiTile` props: `label`, `value`, `sub`, `className`, `variant` — same in all tasks.
- `kpi.total`, `kpi.active`, `kpi.delayed`, `kpi.atRisk` are the same keys used in existing code — no renames.

**4. Dependency check:**
- Tasks 4 and 5 depend on Task 3 (KpiTile variant). Must complete Task 3 first.
- Tasks 1, 2, 3 are fully independent — can be implemented in any order.
- Task 5 is independent of Task 4.

**Gaps found and resolved:**
- `ClipboardList` icon for Tasks nav item: if not in installed lucide-react version, fallback is `ListTodo` or `SquareCheckBig`. The TypeScript step catches this.
- `BOARD` constant in dashboard/page.tsx: unchanged, still used by `kpi.board.map()` in new layout — no issue.
- `overdueTasks` and `upcoming` from `getKpi()`: still fetched, just not displayed in the KPI grid anymore — no code change needed to the query.
