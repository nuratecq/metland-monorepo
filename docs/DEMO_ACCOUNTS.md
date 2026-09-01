# Demo Accounts

Login (`POST /api/auth/login` in both `project-management` and `catalogue`) is a
**passwordless demo flow**: it accepts any email, ignores the password field, and
auto-creates the user on first login. There is no real credential check — the
accounts below are just the ones pre-seeded with data (`packages/db/src/seed-demo.ts`,
`seed-real.ts`) so logging in as them shows something meaningful instead of an
empty account. Any other email also works, just with no history attached.

Both apps share the same session cookie (`metland_session`, SSO via `@metland/auth`),
so one login works across `project-management` and `catalogue`.

| Email | Password | Name | Use for |
|---|---|---|---|
| `demo@metland.co.id` | *(anything)* | Demo User | General walkthrough — owns the seeded approvals & notifications |
| `manager@metland.co.id` | *(anything)* | Manager | Approving PM approvals (`PRJ-MENTENG` is pre-approved by this user) |
| `procurement@metland.co.id` | *(anything)* | Procurement | Catalogue approval requests (contractor recommendation for high-rise Bekasi) |

## Seeded data these accounts see

- **PM approvals** (`project-management` → Approvals): `PRJ-MENTENG` (APPROVED by Manager), `PRJ-CIBITUNG` (SUBMITTED), one more `IN_REVIEW`.
- **Notifications** (`project-management` → Notifications, on `demo@metland.co.id`): task assigned, milestone due, approval requested.
- **Catalogue recommendation** (`catalogue` → Recommendations): "Cari kontraktor struktur high rise" → WIKA, with a `SUBMITTED` approval request from Procurement.

## Re-seeding

```bash
pnpm --filter @metland/db exec tsx src/seed-real.ts   # 10 real Metland projects + milestones/tasks
pnpm --filter @metland/db exec tsx src/seed-demo.ts   # the 3 accounts above + approvals/notifications/recommendation
```

Requires `TURSO_PM_DATABASE_URL` / `TURSO_CATALOGUE_DATABASE_URL` (or the shared
`TURSO_DATABASE_URL`) and matching auth tokens in the environment.
