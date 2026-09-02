# Demo Accounts

Password semua akun: **`Demo1234`**

| Email | Nama |
|---|---|
| `demo@metland.co.id` | Demo User |
| `manager@metland.co.id` | Manager |
| `procurement@metland.co.id` | Procurement |
| `test@metland.co.id` | Test |

Satu login berlaku di `project-management` dan `catalogue` (cookie `metland_session`).

Ganti password:

```bash
MIGRATE_PASSWORD='...' pnpm --filter @metland/db exec tsx src/migrate-passwords.ts
```
