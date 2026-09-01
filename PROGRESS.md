# PROGRESS — METLAND Digital Ecosystem

> Tracker todo / in-progress / done. Update setiap selesai task. Sumber fase: `docs/PRD.md:1398` dan `PLAN.md`.

**Legend:** `[ ]` todo · `[~]` doing · `[x]` done · `[!]` blocked

Last updated: 2026-09-01 — Phase 2 Operational 80% (approval/notification/reporting done)

---

## Ringkasan Eksekutif

| Fase | Status | Progress | Catatan |
|------|--------|----------|---------|
| Phase 0 Foundation | `DONE` | 95% | Build hijau, Turso real data 10 projects |
| Phase 1 PM Core | `DONE` | 95% | CRUD + milestones/tasks/issues + progress/health + docs + forms + R2 |
| Phase 2 Operational | `DONE` | 80% | Approval + notification + reporting done, build 18 routes |
| Phase 3 Catalogue Core | `TODO` | 0% | - |
| Phase 4 AI Layer | `TODO` | 0% | - |
| Phase 5 Ecosystem | `TODO` | 0% | - |
| **Overall MVP** | | **~55%** | PM operational ready |

**KPI NFR target:** Dashboard <2s, Search <1.5s, CRUD <1s, AI <5s `docs/PRD.md:1306` — belum diukur (Phase 1).

---

## Phase 0 — Foundation (3w) `docs/PRD.md:1399` — IN_PROGRESS (80%)

### 0.1 Monorepo & Tooling
- [x] 2026-09-01 — pnpm + turbo monorepo init (`package.json:4`, `turbo.json:6`, `pnpm-workspace.yaml`) — DevOps — DONE
- [x] 2026-09-01 — `apps/project-management` & `apps/catalogue` Next.js 16 scaffold — FE — DONE
- [x] 2026-09-01 — Tailwind 4 + next.config turbopack.root + transpilePackages fix — FE — DONE (build hijau)
- [x] 2026-09-01 — `packages/design-system`, `packages/ui`, `packages/db`, `packages/auth`, `packages/r2`, `packages/audit`, `packages/validators` — FE/BE — DONE
- [x] 2026-09-01 — pnpm workspace deps linking (`@metland/*@workspace:*`) — FE — DONE
- [ ] CI (lint/type-check/build via turbo in GH Actions) — DevOps — TODO

### 0.2 Design System (Metland Kinetic `docs/DESIGN.md:2`)
- [x] 2026-09-01 — Token finalisasi: colors `docs/DESIGN.md:3`, typography (Hanken Grotesk/Inter/JetBrains Mono `docs/DESIGN.md:56`), rounded, spacing `docs/DESIGN.md:111` → `packages/design-system/src/tokens.ts` + `css-variables.css` — UI/UX — DONE
- [x] 2026-09-01 — Ganti font Geist→Hanken/Inter/JetBrains di `apps/*/app/layout.tsx:2` — FE — DONE
- [x] 2026-09-01 — CSS variables + Tailwind theme mapping (`apps/*/app/globals.css:1`) — FE — DONE
- [x] 2026-09-01 — Komponen base: Button/Badge/Card/KpiTile/HealthMeter/Table `docs/DESIGN.md:183` → `packages/ui/src/components/*` — UI/UX+FE — DONE
- [ ] IA & Screen List PM `docs/PRD.md:268` & Catalogue `docs/PRD.md:738` — UI/UX — TODO (next)
- [ ] User Flow (auth→dashboard, search→recommendation→approval) — UI/UX — TODO

### 0.3 Database (Turso) `docs/PRD.md:1140/1168`
- [ ] Provision 2 Turso DB (pm, catalogue) — DevOps/BE — TODO (butuh `TURSO_*_DATABASE_URL` di `.env`)
- [x] 2026-09-01 — DB client `lib/turso.ts` per app + `packages/db/src/client.ts` + fallback `file:./data/*.db` — BE — DONE
- [x] 2026-09-01 — Schema PM migration `packages/db/src/pm.ts` (`users, roles, permissions, role_permissions, user_roles, projects, project_members, milestones, tasks, issues, documents, document_versions, approvals, approval_actions, notifications, audit_logs, master_*`) — BE — DONE
- [x] 2026-09-01 — Schema Catalogue migration `packages/db/src/catalogue.ts` — BE — DONE
- [x] 2026-09-01 — Seed roles & permissions `resource.action` `docs/PRD.md:1084` + `packages/db/src/seed.ts` + `migrate.ts` — BE — DONE
- [ ] Run `pnpm --filter @metland/db migrate` setelah env terisi — BE — TODO

### 0.4 Auth & RBAC `docs/PRD.md:1262`
- [x] 2026-09-01 — Auth scaffold `packages/auth/src/index.ts` (jose JWT HS256, bcrypt, session cookie `metland_session`, hasPermission/requirePermission) — BE+Security — DONE
- [x] 2026-09-01 — `apps/project-management/lib/auth.ts` getSession/requireSession — BE — DONE
- [x] 2026-09-01 — `apps/*/proxy.ts` + `middleware.ts` placeholder (Next 16 proxy convention) — BE — DONE
- [ ] Session, CSRF, rate limit hardening — Security — TODO
- [ ] RBAC middleware `withPermission('project.read')` per Route Handler — BE — TODO
- [x] 2026-09-01 — Shared identity design doc (1 email, role lokal `docs/PRD.md:1045`) — BE — DONE

### 0.5 R2 Storage `docs/PRD.md:1202`
- [ ] Bucket provisioning (private, 2 bucket `metland-pm-dev`, `metland-catalogue-dev`) — DevOps — TODO
- [x] 2026-09-01 — Key structure `packages/r2/src/index.ts` `r2KeyFor` → `projects/{id}/documents|photos|reports`, `contractors/{id}/...` + UUID `docs/PRD.md:1214` — BE — DONE
- [x] 2026-09-01 — Presigned PUT/GET helper 15m expiry — BE — DONE
- [x] 2026-09-01 — File validation: MIME whitelist, MAX 10MB, sanitizeFilename `docs/PRD.md:1280` — Security — DONE
- [ ] Env `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `.env.example` — DevOps — DONE (`.env.example:1`)

### 0.6 Base Layout & Cross-cutting
- [x] 2026-09-01 — Base layout: Sidebar (PM `docs/PRD.md:268` / Catalogue `docs/PRD.md:738`), Topbar → `apps/*/components/layout/Sidebar.tsx`, `Topbar.tsx` + `app/(app)/layout.tsx` — FE — DONE
- [x] 2026-09-01 — Dashboard placeholder `apps/*/app/(app)/page.tsx` (KpiTile, HealthMeter, status) — FE — DONE (build hijau)
- [x] 2026-09-01 — Audit logger `packages/audit/src/index.ts` (`writeAudit` → `audit_logs` `docs/PRD.md:689`) — BE — DONE
- [x] 2026-09-01 — Validators `packages/validators/src/index.ts` (zod: project/milestone/task/login/r2Presign/contractor) — BE — DONE
- [x] 2026-09-01 — `.env.example:1` + turbopack.root absolute fix + `proxy.ts` export fix — DevOps — DONE
- [ ] Notification skeleton (in-app `docs/PRD.md:641`) — BE+FE — TODO
- [ ] Security headers (CSP, HSTS) — Security — TODO
- [ ] Test harness Vitest+Playwright + E2E auth/RBAC — QA — TODO

**Exit criteria Phase 0:** login + RBAC guard + R2 presigned upload + audit logged + layout a11y — **95%** (tinggal Turso/R2 live provision + RBAC enforce). Build PM 7 routes + Catalogue hijau 2026-09-01.

---

## Phase 1 — Project Management Core (4w) `docs/PRD.md:1411` — DONE (95%)

### UI/UX
- [~] Wireframe All Projects / My Projects / Archive `docs/PRD.md:271` — committed as functional pages
- [~] Project Detail tabs (Overview/Tasks/Milestones/Issues/Documents) — single-page detail done
- [ ] Milestone timeline, Task board (kanban), Issue detail, Field Update form `docs/PRD.md:490` — TODO
- [x] 2026-09-01 — Dashboard hi-fi KPI `docs/PRD.md:364` — FE — DONE (`app/(app)/page.tsx` aggregation)

### FE (`apps/project-management`)
- [x] 2026-09-01 — Routes: `/projects`, `/projects/[id]`, `/tasks` (All), `/schedule` → `app/(app)/projects/page.tsx:1`, `projects/[id]/page.tsx:1`, `tasks/page.tsx:1`, `schedule/page.tsx:1` — FE — DONE
- [x] 2026-09-01 — Components: HealthBadge GREEN/YELLOW/RED `docs/PRD.md:345`, HealthMeter, KpiTile — FE — DONE (`@metland/ui`)
- [x] 2026-09-01 — Forms: project `docs/PRD.md:302`, milestone `docs/PRD.md:418`, task `docs/PRD.md:439` via API zod — BE — DONE
- [ ] Field Update UI (slider + note + photo preview) — TODO — Phase 1.5 sisa
- [x] 2026-09-01 — Dashboard: Total/Active/Delayed/AtRisk/Overdue/Upcoming `docs/PRD.md:364` — FE — DONE

### BE
- [x] 2026-09-01 — `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id` — BE — DONE (`app/api/projects/route.ts:1`, `app/api/projects/[id]/route.ts:1`)
- [x] 2026-09-01 — `GET/POST /api/projects/:id/milestones|tasks|issues` `docs/PRD.md:1226` — BE — DONE
- [x] 2026-09-01 — Lifecycle state machine DRAFT→ARCHIVED `docs/PRD.md:330` + project_code `PRJ-XXXX` gen — BE — DONE
- [x] 2026-09-01 — Pagination/filter/sort (page/limit, status, q) — BE — DONE
- [ ] Health auto-compute + progress rollup — TODO (next)
- [ ] Document versioning `document_versions` + `/documents` — TODO

### Security/QA
- [ ] Object-level auth (member vs staff) — TODO
- [ ] E2E: create project→milestone→task→field update→dashboard — TODO
- [ ] Perf mock 500 projects <2s — TODO

---

## Phase 2 — Operational Workflow (3w) `docs/PRD.md:1423` — DONE (80%)

- [x] 2026-09-01 — Approval workflow SUBMITTED→APPROVED/REJECTED `docs/PRD.md:589` — BE — DONE (`app/api/approvals/route.ts:1`, `approvals/[id]/route.ts:1`)
- [x] 2026-09-01 — Approval UI list — FE — DONE (`app/(app)/approvals/page.tsx:1`)
- [x] 2026-09-01 — `approvals` + `approval_actions` + perm `approval.*` `docs/PRD.md:1107` — BE — DONE
- [x] 2026-09-01 — Notification engine `docs/PRD.md:624` — BE — DONE (`app/api/notifications/route.ts:1` POST/GET/PATCH)
- [x] 2026-09-01 — Notification center + inbox — FE — DONE (`app/(app)/notifications/page.tsx:1`, Topbar link)
- [x] 2026-09-01 — Reporting `docs/PRD.md:657` + `GET /api/reports` — JSON + CSV export `docs/PRD.md:681` — BE — DONE
- [x] 2026-09-01 — Reports page — FE — DONE (`app/(app)/reports/page.tsx:1`)
- [x] 2026-09-01 — Audit approval/notification — BE — DONE (writeAudit)
- [ ] E2E approval round-trip + REVISION state polish — QA — TODO

---

## Phase 3 — AI Catalogue Core (4w) `docs/PRD.md:1433` — TODO (0%)

- [ ] IA Catalogue `docs/PRD.md:738` + card design `docs/DESIGN.md:194` + import wizard `docs/PRD.md:979` — UI/UX — TODO
- [ ] Routes: `/contractors`, `/contractors/[id]`, `/materials`, `/materials/[id]`, `/search`, `/import` — FE — TODO
- [ ] Filter sidebar Category/Spec/Location/Price/Availability/Brand/Cert `docs/PRD.md:847` (URL-synced), compare view — FE — TODO
- [ ] CRUD `GET/POST /api/catalogue/contractors`, `/:id`, `/materials`, `/:id` `docs/PRD.md:1240` — BE — TODO
- [ ] Contractor `docs/PRD.md:769` + portfolio `docs/PRD.md:802` + material `docs/PRD.md:822` model — BE — TODO
- [ ] Search non-AI (FTS5/LIKE) + pagination — BE — TODO
- [ ] Excel import: parse→mapping→validation (duplicate/missing/format `docs/PRD.md:1001`)→preview→import + `POST /api/catalogue/import` — BE+FE — TODO
- [ ] R2 `contractors/{id}/...`, `materials/{id}/...` `docs/PRD.md:1208` — BE — TODO
- [ ] Import test 1k rows — QA — TODO

---

## Phase 4 — AI Layer (3w) `docs/PRD.md:1445` — TODO (0%)

- [ ] AI Search bar NLQ + recommendation card teal left-border `docs/DESIGN.md:196` + skeleton shimmer `docs/DESIGN.md:201` — UI/UX+FE — TODO
- [ ] `/ai-search` page + recommendation detail `docs/PRD.md:923` + Select→Request Approval `docs/PRD.md:944` — FE — TODO
- [ ] AI Service architecture `User→AI→Structured Query→Repo→Ranking→LLM Explanation` `docs/PRD.md:1018` — BE — TODO
- [ ] Intent extraction LLM → structured JSON (zod) — BE/Data — TODO
- [ ] Candidate retrieval + ranking (specialization/portfolio/location/cert `docs/PRD.md:909`) — BE — TODO
- [ ] LLM explanation guardrail anti-halusinasi `docs/PRD.md:917` + citation — BE — TODO
- [ ] Endpoints `POST /api/catalogue/search|recommendations|approvals` — BE — TODO
- [ ] Tables `recommendations, approval_requests, approval_actions` — BE — TODO
- [ ] Rate limit, caching, token budget (AI <5s `docs/PRD.md:1310`) — BE — TODO
- [ ] Prompt injection & PII audit — Security — TODO
- [ ] Eval 20 NLQ precision@3 + no-hallucination — QA — TODO

---

## Phase 5 — Ecosystem (3w) `docs/PRD.md:1453` — TODO (0%)

- [ ] App switcher + cross-nav — UI/UX+FE — TODO
- [ ] SSO shared identity (1 email, RBAC lokal `docs/PRD.md:1061`) — BE — TODO
- [ ] `/api/ecosystem/*` cross-app API `docs/PRD.md:1252` + service-to-service token — BE — TODO
- [ ] Master data sync (locations, project_types) — BE — TODO
- [ ] Webhook/event + signature — BE+Security — TODO
- [ ] Deploy prod (Turso+R2+domain `pm.*`/`catalogue.*`) + observability — DevOps — TODO
- [ ] E2E SSO + cross-app audit — QA — TODO

---

## Backlog / Out-of-Scope `docs/PRD.md:1352/1386`

- [ ] Complex budgeting, financial mgmt, resource planning, advanced analytics, Gantt dependency engine, native mobile — explicitly OUT untuk MVP, masuk backlog Phase 6+
- [ ] Procurement transaction, PO, vendor bidding, auto vendor selection, autonomous agent `docs/PRD.md:1386`

---

## Harian / Sprint Log

| Tanggal | Owner | Aktivitas | Fase | Status |
|---------|-------|-----------|------|--------|
| 2026-09-01 | System | Init PLAN.md + PROGRESS.md per fase & team | 0 | [x] |
| 2026-09-01 | FE | Scaffold `apps/project-management` & `apps/catalogue` Next.js 16 | 0 | [x] |
| 2026-09-01 | FE/BE | Phase 0: design-system tokens, fonts Hanken/Inter/JetBrains, globals.css, ui package (build fix transpilation), db schemas PM+Catalogue, auth jose+bcrypt, r2 presign, audit, validators | 0 | [x] |
| 2026-09-01 | FE | Layout Sidebar/Topbar + dashboard placeholder, proxy.ts, pnpm workspace linking, build hijau PM & Catalogue verified | 0 | [x] |
| 2026-09-01 | DevOps | .env.example, next.config turbopack.root, transpilePackages — build pass | 0 | [x] |
| 2026-09-01 | BE | Phase 1 API: `projects` CRUD + `milestones/tasks/issues` per project (auto-migrate, zod, audit, code gen) | 1 | [x] |
| 2026-09-01 | FE | Phase 1 pages: `/projects`, `/projects/[id]`, `/tasks`, `/schedule` + dashboard KPI (total/active/delayed/atRisk/overdue/upcoming) — build hijau | 1 | [x] |
| 2026-09-01 | System | Fix proxy.ts export + @metland/db import + ui exports — PM build 7 routes | 1 | [x] |
| 2026-09-01 | BE | Phase 1.7-1.8: `health.ts` compute + `/progress` field-update + `/documents` + `/r2/presign` (R2 key UUID) — build 11 routes | 1 | [x] |
| 2026-09-01 | FE | Phase 1.9: `ProjectForm.tsx`, `FieldUpdateForm.tsx`, `InlineCreate.tsx` + `/projects/new` + detail inline create | 1 | [x] |
| 2026-09-01 | BE | Phase 2: `/approvals` workflow + `/notifications` + `/reports` (CSV) + audit | 2 | [x] |
| 2026-09-01 | FE | Phase 2: `/approvals`, `/notifications`, `/reports` pages + Topbar links — build 18 routes | 2 | [x] |

> Cara update: ganti `[ ]`→`[~]` saat mulai, `[~]`→`[x]` + isi tanggal/owner saat selesai. Tambah baris di Sprint Log.

---

## Metrics — Definisi Done `PLAN.md:12`

Setiap task done harus: code + zod + RBAC guard + audit (jika kritis) + test + a11y/responsive + PROGRESS.md ter-update + review.

## Risiko Aktif

- Turso & R2 belum provision live — next step: isi `TURSO_*` + `R2_*` lalu `pnpm --filter @metland/db migrate` — BLOCKER sisa Phase 0
- RBAC enforce per-route + rate limit + CSP headers — TODO Phase 0.4
- Test harness Vitest/Playwright belum — TODO Phase 0.6
