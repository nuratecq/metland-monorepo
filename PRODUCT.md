# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Project Managers and field-team staff at Metland (property and construction developer).
- PMs own projects end-to-end: create projects, set milestones, assign tasks, review documents, process approvals, monitor health status, and generate reports.
- Field team updates daily progress percentages, uploads phase documents, and reports task completions from the office or construction site.

## Product Purpose

Internal project management tool for Metland's construction and property development portfolio. Provides end-to-end project lifecycle visibility from Feasibility Study through Construction, with milestone tracking, document management, Kanban task boards, schedule views, and approval workflows — all centralized in one operational dashboard.

## Positioning

The only PM tool calibrated to Metland's construction phase model (Feasibility → Quantity Surveyor → Design Plan → Construction), with health-status signaling (GREEN/YELLOW/RED) and role-based access that matches Metland's internal org structure. Not a generic SaaS product; every screen maps to a real Metland workflow.

## Operating Context

Desktop-first web application used at office workstations and occasionally in the field via laptop or tablet. Sessions are task-focused: reviewing project health at a glance, drilling into delayed projects, updating task progress, uploading phase documents, and processing approvals before a meeting. Data refreshes on every request (force-dynamic). Multiple users may be editing the same project concurrently.

## Capabilities and Constraints

- Projects: health_status (GREEN/YELLOW/RED), progress %, status (ACTIVE/PLANNED/ON_HOLD/COMPLETED/ARCHIVED)
- Milestones: per-project, drive phase pipeline widget (name, status, completion_percentage, due_date)
- Tasks: Kanban board (TODO/IN_PROGRESS/BLOCKED/DONE), priority (CRITICAL/HIGH/MEDIUM/LOW), assignee, due date
- Documents: attached to projects by category, phase-matched by file_name keyword
- Employees/user management with role-based permissions
- Approval workflows and notification inbox
- Schedule/calendar view and reports section
- Admin: user management, roles, audit trail (permission-gated)
- AI Assistant section (route exists)
- Database: Turso (libSQL) via getDb(); all queries are raw SQL, no ORM
- Monorepo: pnpm + Next.js 15 App Router + Tailwind CSS v4 + @metland/ui component package
- 59 passing Vitest tests — must remain green after any change

## Brand Commitments

- Name: "Metland PM" — logo at `/logo.png` in sidebar header
- Primary color: teal `#006767` — non-negotiable
- Fonts: Hanken Grotesk (display/headings, `--font-hanken`) + Inter (body, `--font-inter`) — non-negotiable
- Design system: Metland Kinetic System CSS variables in `packages/design-system/src/css-variables.css`
- Lucide React for all icons — no emoji, no mixing icon libraries

## Evidence on Hand

- Running Next.js application with real Turso DB
- DESIGN.md documents full Metland Kinetic System token set
- Reference dashboard image: `c:\Users\argfh\Downloads\new.png` — Donezo PM dashboard used as design language reference

## Product Principles

1. **Operational clarity over decoration** — every UI element earns its presence by reducing cognitive load for PMs monitoring complex portfolios
2. **Health at a glance** — project health (GREEN/YELLOW/RED) and task status must be immediately scannable without drilling in
3. **Phase-aware hierarchy** — construction lifecycle phases (Feasibility → Construction) are first-class information, not buried in details
4. **Consistent density** — information-dense enough for power users, structured enough that field staff can navigate on first use
5. **Preserve and extend** — business logic, routes, DB queries, and component APIs must be preserved; redesign applies to visual layer only
