# Phase 2 Auth, Session, Guards Test Plan

## Automated Checks
- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run api:generate`
- `npm run api:verify`
- `npm run check:boundaries`
- `npm run docs:code-map`
- `npm run docs:check`

## Unit / Integration Coverage
- Auth provider bootstrap refreshes near-expiry sessions and rehydrates access snapshots.
- Auth provider sign-in flow writes session and loads context/rbac/menu snapshots.
- Auth provider sign-out clears local session regardless of logout API outcome.
- Auth provider relaunch restores a valid stored session without forcing refresh.
- Auth provider relaunch clears stale session when refresh fails.
- Unauthorized global handler clears session and surfaces session-expired notice.
- Auth provider menu access gating denies unavailable modules and allows known menus.
- Route guard helper logic for public/protected navigation.
- Auth public route tabs navigate correctly between login/forgot/reset surfaces.

## Deterministic API Control Evidence (March 2, 2026)
Working persona: `hmada96ariqat@gmail.com`

- `POST /api/v1/auth/login` => `201` (`traceId: phase2-close-login-1772428349`)
- `GET /api/v1/auth/context` => `200` (`traceId: phase2-close-context-1772428349`)
- `GET /api/v1/auth/rbac` => `200` (`traceId: phase2-close-rbac-1772428349`)
- `POST /api/v1/auth/refresh` => `201` (`traceId: phase2-close-refresh-1772428349`)
- `POST /api/v1/auth/logout` => `201` (`traceId: phase2-close-logout-1772428349`)

## Auth Request Construction Evidence
- Final login URL: `http://127.0.0.1:3300/api/v1/auth/login`
- Method: `POST`
- Body keys: `email`, `password`
- Headers: `Accept: application/json`, `Content-Type: application/json`, `X-Trace-Id`
- Duplicate path check: no `/api/v1/api/v1` in request URL.

## Web vs Mobile Login Request Diff
- URL base strategy:
  - Web: relative `/api/v1` (same origin)
  - Mobile: absolute API base URL from `EXPO_PUBLIC_API_BASE_URL` (or default), now native host-adjusted when loopback is detected.
- Method: `POST` in both clients.
- Headers:
  - Web: `Content-Type`, `Accept`
  - Mobile: `Content-Type`, `Accept`, `X-Trace-Id` (login has no `Authorization` header)
- Body:
  - Web: `{ email, password }`
  - Mobile: `{ email, password }`

## Mobile Login Root Cause / Fix
- Root cause: native runtime loopback mismatch when using `http://127.0.0.1:3300/api/v1` directly.
- Fix: runtime resolver in `src/config/env.ts` rewrites loopback host to Expo debug host or `10.0.2.2` (Android fallback) while preserving `/api/v1`.
- Temporary debug logs were added around login request/response, captured masked evidence, and removed after verification.

## Known Gaps
- Non-blocking account-state issue: `hamda96ariqat@gmail.com` returns `AUTH_INVALID_CREDENTIALS`; tracked in `docs/testing/test-accounts.md`.
- `QH-OAPI-001`: auth request DTOs are untyped in OpenAPI, so fallback request union types remain.
- `QH-OAPI-002`: subscriptions response schemas are untyped in OpenAPI, so entitlement/menu parsing remains temporary.

## Design alignment update (Enterprise Dense)
- Auth public surfaces now use shared route tabs (`Login`, `Forgot`, `Reset`) for consistent navigation.
- Primary action hierarchy is preserved (single clear submit action per auth surface).
- Reuse contract maintained: shared inputs/forms/errors/loading overlays only.
