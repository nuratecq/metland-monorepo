# Demo Accounts

Login (`POST /api/auth/login` in both `project-management` and `catalogue`) verifies
the submitted password against `users.password_hash` using bcrypt. Accounts are **not**
auto-created on login — an unknown email is rejected, so only seeded or admin-provisioned
users can sign in.

Both apps share the same session cookie (`metland_session`, SSO via `@metland/auth`),
so one login works across `project-management` and `catalogue`.

| Email | Name | Use for |
|---|---|---|
| `demo@metland.co.id` | Demo User | General walkthrough — owns the seeded approvals & notifications |
| `manager@metland.co.id` | Manager | Approving PM approvals (`PRJ-MENTENG` is pre-approved by this user) |
| `procurement@metland.co.id` | Procurement | Catalogue approval requests (contractor recommendation for high-rise Bekasi) |
| `test@metland.co.id` | Test | Left over from the old auto-create login; no seeded data |

## Password

Every account currently in the database uses **`Demo1234`** — set by the migration below
and the default for `SEED_PASSWORD`.

Set your own before seeding:

```bash
SEED_PASSWORD='your-password-here' pnpm --filter @metland/db exec tsx src/seed-demo.ts
```

Re-running the seed **resets** the three demo accounts to the current `SEED_PASSWORD`, so
rotating the value and re-seeding is the supported way to change it.

Rules enforced in `packages/auth/src/login.ts`:

- Minimum 8 characters (`MIN_PASSWORD_LENGTH`).
- `SEED_PASSWORD` is mandatory when `NODE_ENV=production` — the dev fallback is refused there.
- Wrong password and unknown email return the identical 401 message, and both run one
  bcrypt comparison, so the endpoint cannot be used to enumerate valid accounts.
- Accounts with `status` other than `ACTIVE` are refused with 403 even given the right password.

## Seeded data these accounts see

- **PM approvals** (`project-management` → Approvals): `PRJ-MENTENG` (APPROVED by Manager), `PRJ-CIBITUNG` (SUBMITTED), one more `IN_REVIEW`.
- **Notifications** (`project-management` → Notifications, on `demo@metland.co.id`): task assigned, milestone due, approval requested.
- **Catalogue recommendation** (`catalogue` → Recommendations): "Cari kontraktor struktur high rise" → WIKA, with a `SUBMITTED` approval request from Procurement.

## Re-seeding

```bash
pnpm --filter @metland/db exec tsx src/seed-real.ts   # 10 real Metland projects + milestones/tasks
SEED_PASSWORD='...' pnpm --filter @metland/db exec tsx src/seed-demo.ts   # the 3 accounts above + approvals/notifications/recommendation
```

Requires `TURSO_PM_DATABASE_URL` / `TURSO_CATALOGUE_DATABASE_URL` (or the shared
`TURSO_DATABASE_URL`) and matching auth tokens in the environment.

## Migrating an existing database

Rows seeded before password verification existed hold the literal string `'demo'` in
`password_hash`, which is not a valid bcrypt hash and can never match — those users
cannot log in until migrated.

`src/migrate-passwords.ts` sets every user's password to one value:

```bash
MIGRATE_PASSWORD='Demo1234' pnpm --filter @metland/db exec tsx src/migrate-passwords.ts
```

Add `--only-legacy` to skip rows that already hold a valid bcrypt hash, so a later run
cannot clobber passwords real users have set for themselves.

**Already applied** to the shared Turso database (`demo-metland-menglabs`) — all 4 users
were updated from plaintext `'demo'` to a bcrypt hash of `Demo1234`.
