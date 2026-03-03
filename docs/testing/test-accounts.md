
## Environment
- Dev API: `http://127.0.0.1:3300/api/v1`
- Dev Swagger JSON: `http://127.0.0.1:3300/api/docs-json`

## Status (March 2, 2026)
- Deterministic control checks against `POST /api/v1/auth/login`:
  - `hamda96ariqat@gmail.com` => `401 AUTH_INVALID_CREDENTIALS` (`traceId: phase2-control-admin-1772427812`)
  - `Areiqat96@gmail.com` => `201 Created` (`traceId: phase2-control-super-1772427812`)
  - `hmada96ariqat@gmail.com` => `201 Created` (`traceId: phase2-close-login-1772428349`)
- Current conclusion: client request mapping is valid. `hamda96ariqat@gmail.com` is treated as backend account-state issue and not a mobile blocker for Phase 2.

## Test Credentials
| Purpose | Email | Password |
|---|---|---|
| Admin farm user | `hamda96ariqat@gmail.com` | `Ahmad@123` |
| Super admin portal | `Areiqat96@gmail.com` | `Ahmad@123` |
| Phase 2 working persona | `hmada96ariqat@gmail.com` | `Ahmad@123` |

## Smoke Login Checklist
- Login succeeds for Phase 2 working persona (`hmada96ariqat@gmail.com`).
- Login succeeds for super admin user.
- Admin farm user login is currently backend-owned known issue (`hamda96ariqat@gmail.com`).
- `GET /auth/context` returns valid user context after login.
- `GET /auth/rbac` returns role snapshot after login.
