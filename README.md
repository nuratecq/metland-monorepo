# Nuratech Digital Ecosystem

Monorepo untuk ekosistem digital Nuratech: dua aplikasi independen dengan database terpisah namun identitas pengguna bersama.

## Struktur

```
apps/
  project-management/   # Manajemen proyek: project, milestone, task, issue, approval, report
  catalogue/            # Katalog kontraktor & material + AI recommendation
packages/
  design-system/        # Design tokens
  ui/                   # Komponen UI bersama
  db/                   # Skema & migrasi Turso (libsql)
  auth/                 # JWT session + RBAC helpers
  r2/                   # Cloudflare R2 presigned upload/download
  audit/                # Audit logger
  validators/           # Zod validators
  ecosystem/            # Standar cross-app API
```

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Turso (libsql) — DB terpisah per app (`pm.db`, `catalogue.db`)
- Tailwind 4 + design system internal
- Cloudflare R2 untuk object storage
- Turborepo + pnpm
- Vitest untuk testing

## Mulai Cepat

Prasyarat: Node.js ≥ 20, pnpm ≥ 9.

```bash
pnpm install
cp .env.example .env   # isi kredensial Turso/R2/Auth
pnpm --filter @metland/db exec tsx src/migrate.ts
pnpm --filter @metland/db exec tsx src/seed.ts
pnpm dev
```

## Perintah Utama

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Jalankan semua app dalam mode dev |
| `pnpm build` | Build semua app via Turbo |
| `pnpm lint` | Lint semua workspace |
| `pnpm type-check` | TypeScript check |
| `pnpm test` | Vitest |
| `pnpm format` | Prettier |
| `pnpm clean` | Bersihkan build & node_modules |

## Environment

Lihat `.env.example` dan `docs/ENV.md` untuk daftar variabel: Turso (per app), Auth secret, R2, dan LLM (opsional — tanpa `LLM_API_KEY` sistem memakai template explanation deterministik).

## Akun Demo

Lihat `docs/DEMO_ACCOUNTS.md`. Password semua akun demo: `Demo1234`.

## Dokumentasi

- `docs/PRD.md` — Product requirements
- `docs/DESIGN.md` — Design system
- `PLAN.md` — Rencana eksekusi per fase
- `PROGRESS.md` — Tracker progres per fase
