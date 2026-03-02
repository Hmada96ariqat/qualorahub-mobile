
## Environment
- Dev API: `http://127.0.0.1:3300/api/v1`
- Dev Swagger JSON: `http://127.0.0.1:3300/api/docs-json`

## Test Credentials
| Purpose | Email | Password |
|---|---|---|
| Admin farm user | `hamda96ariqat@gmail.com` | `Ahmad@123` |
| Super admin portal | `Areiqat96@gmail.com` | `Ahmad@123` |

## Smoke Login Checklist
- Login succeeds for admin farm user.
- Login succeeds for super admin user.
- `GET /auth/context` returns valid user context after login.
- `GET /auth/rbac` returns role snapshot after login.
