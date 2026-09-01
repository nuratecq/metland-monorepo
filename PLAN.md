# PLAN — METLAND Digital Ecosystem

> Sumber: `docs/PRD.md` dan `docs/DESIGN.md` (Metland Kinetic System)
> Monorepo: `apps/project-management` + `apps/catalogue` | Stack: Next.js 16 / TypeScript / Turso / R2 / Tailwind 4
> Last updated: 2026-09-01

---

## 0. Ringkasan Eksekusi

Ekosistem terdiri dari 2 app independen (DB terpisah, identity shared, RBAC lokal) — `docs/PRD.md:131`. Urutan eksekusi mengacu `docs/PRD.md:1625` dan pembagian fase `docs/PRD.md:1398`.

**Prinsip non-negotiable:**
1. Separate Apps, Separate DB, Clear Boundaries `docs/PRD.md:1697`
2. Shared Identity, Local Authorization `docs/PRD.md:1699`
3. AI Recommends, Human Approves + Data First `docs/PRD.md:1700`
4. Audit Everything Important `docs/PRD.md:1702`
5. R2 hanya object storage, DB hanya metadata `docs/PRD.md:188`

**Target NFR MVP** `docs/PRD.md:1306`: Dashboard <2s, Search <1.5s, CRUD <1s, AI <5s.

---

## 1. Struktur Tim & Tanggung Jawab

| Team | Scope | Ownership Utama |
|------|-------|-----------------|
| **UI/UX** | Design System, IA, User Flow, Prototype, A11y | Token, komponen, screen list |
| **FE** | Next.js App Router, Server Components, Route Handlers, state, R2 signed URL client | `apps/*` |
| **BE** | Turso schema, Route Handlers/Server Actions, RBAC, validation, R2 presign, audit, notification | `db/`, `server/`, `lib/` |
| **Security** | Auth, session, RBAC enforcement, file validation, rate limit, secrets, CSP | Cross-cutting |
| **QA** | Test plan, E2E, performance, security test | `__tests__/`, CI |
| **DevOps/Infra** | Turso provisioning, R2 bucket, env, CI/CD (turbo), deploy, observability | `turbo.json`, infra |
| **Data/AI** | Catalogue data model, import pipeline, search, ranking, LLM explanation guardrail | `apps/catalogue` AI layer |
| **PM/Docs** | Scope control, API contract, rilis, PROGRESS.md | `docs/` |

**Shared standard (design):** Typography/Spacing/Color/Iconography/Components/Radius/Forms/Tables `docs/PRD.md:1505` + tokens `docs/DESIGN.md:3`.

---

## 2. Peta Fase & Dependensi

```
Phase 0 Foundation ─┬─> Phase 1 PM Core ──> Phase 2 Operational ─┐
                    │                                            ├─> Phase 5 Ecosystem
                    └─> Phase 3 Catalogue ─> Phase 4 AI Layer ──┘
```

*   Phase 0 blokir semua fase lain.
*   Phase 1 & 3 bisa paralel setelah Phase 0 selesai.
*   Phase 2 butuh Phase 1. Phase 4 butuh Phase 3.
*   Phase 5 butuh Phase 2 + 4 stabil.

Estimasi effort (team-weeks, 5-day, asumsi 2 FE + 2 BE + 1 UI/UX + 0.5 Sec/QA/DevOps):

| Fase | Durasi | Parallel |
|------|--------|----------|
| 0 Foundation | 3 w | - |
| 1 PM Core | 4 w | || 3 |
| 2 Operational | 3 w | seq after 1 |
| 3 Catalogue | 4 w | || 1 |
| 4 AI Layer | 3 w | seq after 3 |
| 5 Ecosystem | 3 w | seq after 2+4 |
| **Total sequential** | **~13 w** jika 1 & 3 paralel; **~20 w** jika serial |

---

## 3. Phase 0 — Foundation (3 minggu) `docs/PRD.md:1399`

**Tujuan:** Pondasi yang dipakai kedua app. Keluar dari fase ini kedua app sudah bisa auth + RBAC + audit + upload R2 dummy.

### 3.1 Deliverables
- Design System package publishable (tokens + komponen)
- Turso schema v1 untuk kedua DB (migration + seed)
- Auth + session + RBAC middleware
- R2 integration (presigned upload/download, key structure)
- Base layout (sidebar, topbar, auth guard)
- Audit system + notifikasi in-app skeleton
- API contract draft (OpenAPI/Route Handler spec)

### 3.2 Per-Team Breakdown

#### UI/UX
- [ ] Finalisasi token dari `docs/DESIGN.md:3` → `packages/design-system/tokens.json` (colors, typography Hanken Grotesk/Inter/JetBrains Mono `docs/DESIGN.md:146`, rounded `docs/DESIGN.md:104`, spacing `docs/DESIGN.md:111`)
- [ ] IA & Screen List untuk kedua app (`docs/PRD.md:1625` langkah 1-3) — sitemap PM `docs/PRD.md:268` dan Catalogue `docs/PRD.md:738`
- [ ] User Flow (login → dashboard → project detail; search → recommendation → approval)
- [ ] Komponen base di Figma + story: Button/Input/Table/Badge/Modal/KPI Tile/Health Meter `docs/DESIGN.md:183`
- [ ] Breakpoint spec (mobile <600, tablet 600-1024, desktop 1440) `docs/DESIGN.md:163`

#### FE (PM + Catalogue)
- [ ] Monorepo setup: `packages/design-system`, `packages/ui`, `packages/tsconfig`, `packages/eslint-config` (turbo pipeline)
- [ ] Ganti font Geist → Hanken Grotesk + Inter + JetBrains Mono (saat ini masih `geist` di `apps/*/app/layout.tsx:2`)
- [ ] Implement tokens sebagai CSS variables + Tailwind theme (`apps/*/app/globals.css`)
- [ ] Base layout: Sidebar nav (PM `docs/PRD.md:268`, Catalogue `docs/PRD.md:738`), topbar user, breadcrumb, auth guard
- [ ] Komponen FE: Table dense (row 32-40px `docs/DESIGN.md:161`), StatusBadge (Green/Yellow/Red/Blue/Gray `docs/DESIGN.md:134`), HealthMeter, KpiTile, Skeleton AI `docs/DESIGN.md:201`

#### BE
- [ ] Turso setup: 2 DB terpisah (`pm.db`, `catalogue.db`) — provider `lib/turso.ts` per app, env `TURSO_*_DATABASE_URL / AUTH_TOKEN`
- [ ] Schema PM `docs/PRD.md:1140`: `users, roles, permissions, role_permissions, projects, project_members, milestones, tasks, issues, documents, document_versions, approvals, approval_actions, notifications, audit_logs, master_project_types, master_locations` — dengan FK, index, migration tool (drizzle-orm / prisma-turso)
- [ ] Schema Catalogue `docs/PRD.md:1168`: `users, roles, permissions, role_permissions, contractors, contractor_categories, contractor_specializations, contractor_portfolios, contractor_certifications, materials, material_categories, material_specifications, suppliers, recommendations, approval_requests, approval_actions, documents, notifications, audit_logs`
- [ ] Seed: roles (System Admin / Management / PM / Project Control / Site Engineer / Field Staff untuk PM `docs/PRD.md:221`; Procurement/Purchasing/Catalogue Admin untuk Catalogue) + permissions `resource.action` `docs/PRD.md:1084`
- [ ] Auth: NextAuth/Auth.js atau custom JWT + session (HttpOnly cookie, expiry, refresh) — shared identity design `docs/PRD.md:1045`
- [ ] RBAC middleware: `withPermission('project.read')` per Route Handler + Server Action guard
- [ ] Audit logger: helper `audit({user_id, action, entity_type, entity_id, old_value, new_value, ip, ua})` `docs/PRD.md:689`

#### Security
- [ ] Auth hardening: bcrypt/argon2, session rotation, CSRF, rate limit (login 5/min, upload 10/min)
- [ ] Input validation: zod validators `validators/` per `docs/PRD.md:1608`
- [ ] File validation spec: allowed MIME, max size, filename sanitization, randomized R2 key `docs/PRD.md:1280` — jangan pakai filename sebagai key `docs/PRD.md:1214`
- [ ] Secrets management: env via Vercel/Turso dashboard, tidak commit `.env`
- [ ] CSP + headers (HSTS, X-Frame-Options)

#### DevOps
- [ ] Turso DB provisioning + branching (dev/staging/prod)
- [ ] R2 bucket: `metland-pm-dev`, `metland-catalogue-dev` dengan struktur key `docs/PRD.md:1202` + private bucket + signed URL expiry 15m
- [ ] Env template `.env.example` per app + turbo `globalEnv: NEXT_PUBLIC_*` `turbo.json:5`
- [ ] CI: `pnpm lint + type-check + build` di turbo, preview deploy

#### QA
- [ ] Test harness: Vitest + Playwright, setup `pnpm test`
- [ ] Contract test untuk auth/RBAC (unauthorized → 401/403)

**Exit criteria Phase 0:** Login/logout, RBAC guard bekerja per role, upload file ke R2 via signed URL + metadata di DB, audit log tercatat, base layout lolos a11y, build turbo hijau.

---

## 4. Phase 1 — Project Management Core (4 minggu) `docs/PRD.md:1411`

**Tujuan:** CRUD Project/Milestone/Task/Issue + field update + dashboard KPI.

### Deliverables
- Project lifecycle DRAFT→ARCHIVED `docs/PRD.md:330`, health GREEN/YELLOW/RED `docs/PRD.md:345`
- Milestone Gantt-like list dengan progress `docs/PRD.md:400`
- Task board (TODO/IN_PROGRESS/BLOCKED/DONE `docs/PRD.md:455`)
- Issues (OPEN→CLOSED `docs/PRD.md:534`)
- Field update + photo upload
- Dashboard KPI `docs/PRD.md:364`

### Per-Team

#### UI/UX
- [ ] Wireframe → hi-fi untuk: All Projects, My Projects, Project Detail (tabs: Overview/Tasks/Milestones/Issues/Documents), Task Detail, Milestone timeline, Field Update form, Dashboard
- [ ] Data-density spec: table condensed, KPI tile large numeric + label `docs/DESIGN.md:198`

#### FE
- [ ] Routes: `/projects`, `/projects/[id]`, `/tasks` (My/All/Overdue `docs/PRD.md:276`), `/schedule`, `/documents`
- [ ] Komponen: ProjectCard, ProjectHealthBadge (🟢/🟡/🔴 `docs/PRD.md:377`), ProgressVariance, MilestoneBar, TaskKanban/Table toggle, IssueSeverityBadge
- [ ] Form: create/edit project (fields `docs/PRD.md:302`), milestone `docs/PRD.md:418`, task `docs/PRD.md:439`, issue `docs/PRD.md:508`
- [ ] Field update UI: progress slider + note + attachment preview `docs/PRD.md:490`
- [ ] Dashboard: Total/Active/Completed/Delayed/AtRisk/Upcoming Milestones/Overdue Tasks `docs/PRD.md:364` — chart variance Planned vs Actual `docs/PRD.md:387`

#### BE
- [ ] Route Handlers `docs/PRD.md:1226`: `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`, `.../tasks`, `.../milestones`, `.../issues`, `.../documents`, `.../progress`, `.../members`
- [ ] Business logic: project_code generator (`PRJ-XXX`), lifecycle state machine, health auto-compute (overdue task/milestone → YELLOW/RED), progress rollup milestone→project
- [ ] Pagination, filtering, sorting (by status/health/due_date)
- [ ] Document metadata `docs/PRD.md:559` + versioning `document_versions`
- [ ] R2: presign PUT `/projects/{id}/photos/*`, GET signed URL, delete

#### Security
- [ ] Object-level auth: hanya member/PM/Admin bisa mutate project; Field Staff hanya assigned task
- [ ] File MIME whitelist (image/jpeg/png, application/pdf), max 10MB, virus scan hook (future `docs/PRD.md:1293`)

#### QA
- [ ] E2E: create project → add milestone → create task → field update → dashboard reflects
- [ ] Performance: dashboard <2s `docs/PRD.md:1307` (mock 500 projects)

---

## 5. Phase 2 — Operational Workflow (3 minggu) `docs/PRD.md:1423`

**Tujuan:** Approval, notification, reporting, audit matang untuk PM.

### Per-Team

#### UI/UX
- [ ] Flow approval `docs/PRD.md:589` (DRAFT→SUBMITTED→IN_REVIEW→APPROVED + REJECTED→REVISION) — design modal approver + comment
- [ ] Notification center (bell + list) `docs/PRD.md:624`: Task Assigned/Due/Overdue, Milestone Due, Approval Requested/Approved/Rejected
- [ ] Report template: Project Summary + Dashboard Report `docs/PRD.md:657`

#### FE
- [ ] Approval UI: submit, review, approve/reject + history timeline
- [ ] Notification: polling / SSE in-app (MVP), badge unread, mark-read
- [ ] Report: preview + export PDF/Excel `docs/PRD.md:681` (client trigger server generate)

#### BE
- [ ] Tables: `approvals, approval_actions` dengan workflow state machine + guard `approval.create/approve/reject` `docs/PRD.md:1107`
- [ ] Notification engine: event-driven insert `notifications`, Route `GET /api/notifications` + mark-read
- [ ] Reporting: `/api/reports` — agregasi progress/milestone/issues/task status per period, generate PDF (pdfkit) / Excel (exceljs)
- [ ] Audit: log semua approval/notification/report action `docs/PRD.md:689`

#### Security/QA
- [ ] Approval auth: hanya Management/PM tertentu bisa approve sesuai matrix
- [ ] Test: approval round-trip, notification delivery, report export

---

## 6. Phase 3 — AI Catalogue Core (4 minggu) `docs/PRD.md:1433`

**Tujuan:** Catalogue kontraktor & material siap pakai + import + search/filter non-AI.

### Deliverables
- Contractor entity `docs/PRD.md:769` + portfolio `docs/PRD.md:802` + certifications
- Material entity `docs/PRD.md:822`
- Search & filter powerful tanpa AI `docs/PRD.md:841`
- Excel import `docs/PRD.md:979`
- Documents per catalogue

### Per-Team

#### UI/UX
- [ ] Catalogue IA: All Contractors/Categories/Portfolio, All Materials/Categories/Specs `docs/PRD.md:740`
- [ ] Card design: image placeholder + title + meta-tags teal + smart snippet `docs/DESIGN.md:194` — discovery gutter 24px `docs/DESIGN.md:161`, ambient shadow `docs/DESIGN.md:173`
- [ ] Import wizard UI: Upload → Column Mapping → Validation → Preview → Import `docs/PRD.md:979`

#### FE
- [ ] Routes: `/contractors`, `/contractors/[id]`, `/materials`, `/materials/[id]`, `/search` (filter sidebar), `/import`
- [ ] Filter components: Category/Spec/Location/Price/Availability/Brand/Cert/Supplier `docs/PRD.md:847` — URL-synced
- [ ] Card grid vs table toggle, compare view (2-3 items)
- [ ] Import: drag-drop Excel, mapping table, error highlight (duplicate/missing/format `docs/PRD.md:1001`)

#### BE
- [ ] CRUD `docs/PRD.md:1240`: `/api/catalogue/contractors`, `/:id`, `/materials`, `/:id`, `/import`
- [ ] Import pipeline: parse Excel (exceljs), column mapping, validation, preview (dry-run), transactional import, error report
- [ ] Search: full-text + filter (FTS5 di Turso atau LIKE fallback), pagination, sorting
- [ ] Document handling R2: `contractors/{id}/documents|portfolio`, `materials/{id}/documents` `docs/PRD.md:1208`

#### Data/AI (prep)
- [ ] Seed catalogue contoh + kategorisasi

#### Security/QA
- [ ] Import file validation (MIME excel only, max 20MB), sanitasi cell
- [ ] Test: import 1k rows, filter correctness

---

## 7. Phase 4 — AI Layer (3 minggu) `docs/PRD.md:1445`

**Tujuan:** Natural language search + recommendation + explainability dengan guardrail anti-halusinasi.

### Per-Team

#### UI/UX
- [ ] AI Search bar (NLQ) + recommendation card dengan left-border teal accent `docs/DESIGN.md:196`
- [ ] Explanation block: Why recommended (checklist specialization/experience/location/portfolio/cert `docs/PRD.md:909`)
- [ ] Loading skeleton shimmer `docs/DESIGN.md:201` (bukan spinner), empty/error state

#### FE
- [ ] `/ai-search` page: input NLQ → candidate list + ranking
- [ ] Recommendation detail: Company Profile/Experience/Specialization/Portfolio/Cert + AI summary `docs/PRD.md:923`
- [ ] Approval trigger dari recommendation: Select → Request Approval `docs/PRD.md:944`

#### BE / Data/AI
- [ ] Arsitektur `docs/PRD.md:1015`: `User → AI Service → Structured Query/Intent → Catalogue Repository → Ranking → LLM Explanation` — **AI tidak direct DB** `docs/PRD.md:1013`
- [ ] Intent extraction: LLM (OpenAI/Anthropic) → structured filter JSON (spec, location, project_type) — zod validated
- [ ] Candidate retrieval: query Turso via repository, ranking heuristic (specialization match, portfolio similarity, location, cert)
- [ ] LLM explanation: hanya dari candidate data, prompt guardrail `AI tidak boleh membuat fakta tidak ada di source` `docs/PRD.md:917`, output referensial (cite portfolio id)
- [ ] Endpoints: `POST /api/catalogue/search` (NLQ), `POST /api/catalogue/recommendations`, `POST /api/catalogue/approvals`
- [ ] Tables: `recommendations, approval_requests, approval_actions` `docs/PRD.md:1188`
- [ ] Rate limit AI <5s `docs/PRD.md:1310`, caching, token budget

#### Security
- [ ] Prompt injection guard, PII redaction, audit AI query
- [ ] LLM key di secrets, tidak log PII

#### QA
- [ ] Eval: 20 NLQ sample → precision@3, no-hallucination check
- [ ] Perf: AI <5s p95

---

## 8. Phase 5 — Ecosystem (3 minggu) `docs/PRD.md:1453`

**Tujuan:** Shared identity SSO + cross-app API + shared standards.

### Per-Team

#### UI/UX
- [ ] Cross-app navigation (app switcher), consistent header, breadcrumb ecosystem

#### FE/BE
- [ ] Shared Identity: SSO (next-auth shared DB atau JWT cross-domain), local RBAC tetap `docs/PRD.md:1061` — user Budi = PM di PM + Viewer di Catalogue `docs/PRD.md:1050`
- [ ] Cross-App API: `/api/ecosystem/*` `docs/PRD.md:1252` — service-to-service token, webhook/event untuk project→catalogue context
- [ ] Master data sync (locations, project_types) shared via API
- [ ] Notification cross-app (catalogue approval → PM dashboard jika relevan)

#### Security
- [ ] Service-to-service auth (mTLS / signed JWT), webhook signature
- [ ] Audit cross-app trail

#### DevOps
- [ ] Deploy: vercel (2 projects) atau single domain `pm.metland.id` + `catalogue.metland.id`, Turso prod, R2 prod, CI/CD per app via turbo
- [ ] Observability: logging, error tracking, uptime

**Exit:** Time-to-Decision KPI `docs/PRD.md:1551` terukur, kedua app live, SSO jalan, audit lintas app.

---

## 9. Cross-Cutting Checklist (berlaku semua fase)

| Area | Checklist |
|------|-----------|
| **Security** `docs/PRD.md:1262` | Auth, RBAC `resource.action`, session, zod validation, rate limit, audit logging, file validation, signed R2 URL, secure secrets |
| **R2** `docs/PRD.md:1202` | Key `projects/{id}/...`, `contractors/{id}/...`, UUID key, private bucket, expiry 15m |
| **Performance** `docs/PRD.md:1306` | Dashboard <2s, Search <1.5s, CRUD <1s, AI <5s — ukur dengan Lighthouse + k6 |
| **A11y** | Keyboard nav, focus ring teal, color contrast (teal on white), status badge + text label |
| **Testing** | Unit (helpers), integration (Route Handlers), E2E (Playwright) minimal 70% critical path |

---

## 10. API Contract Ringkas `docs/PRD.md:1221`

**PM:** `GET/POST /api/projects`, `GET/PATCH /api/projects/:id`, `.../:id/tasks|milestones|issues|documents|progress|members`, `GET /api/notifications`, `GET /api/reports`
**Catalogue:** `GET/POST /api/catalogue/contractors`, `/:id`, `/materials`, `/:id`, `POST /api/catalogue/search|recommendations|approvals`, `POST /api/catalogue/import`
**Ecosystem:** `/api/ecosystem/*` (identity, master data sync, webhook)

Semua Route Handlers wajib: `auth → RBAC → zod parse → handler → audit → response`.

---

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Turso FTS lemah | Search lambat >1.5s | Fallback LIKE + pagination, consider Meilisearch later |
| R2 misconfig public | Dok internal bocor `docs/PRD.md:1288` | Private bucket default, CI check bucket ACL |
| LLM hallucination | Rekomendasi palsu `docs/PRD.md:917` | Guardrail prompt + citation + human approval mandatory |
| Scope creep (budgeting/Gantt `docs/PRD.md:1353`) | Delay | Strict MVP scope gate per `docs/PRD.md:1329/1369` |
| Monorepo DB boundary leak | Data PM tercampur catalogue | 2 Turso DB + 2 `lib/turso` clients, lint rule import cross-app DB |

---

## 12. Definisi Done (per task)

- [ ] Code + zod validation + RBAC guard
- [ ] Audit log jika entity kritis
- [ ] Test (unit/integration) + manual QA
- [ ] A11y + responsive (mobile 16px margin `docs/DESIGN.md:115`)
- [ ] PROGRESS.md di-update
- [ ] Review + merged ke `main`

---

## 13. Langkah Selanjutnya (minggu ini)

1. UI/UX kick-off IA & token finalisasi
2. BE provisioning Turso + R2 dev
3. FE setup `packages/design-system` + ganti font Geist→Hanken/Inter/JetBrains
4. Buat migration awal Phase 0 + auth scaffold
5. Tentukan LLM provider untuk Phase 4 (OpenAI vs Anthropic)

