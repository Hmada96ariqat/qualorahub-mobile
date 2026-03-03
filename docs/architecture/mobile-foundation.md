# Mobile Foundation Architecture (Phase 1)

## Scope
- Establish baseline architecture and delivery guardrails.
- Keep implementation limited to foundational routing, API client, tests, and docs.

## Core Decisions
- Navigation: `expo-router` with `(public)` and `(protected)` route groups.
- UI stack: React Native Paper provider at app root.
- Server state: TanStack React Query provider at app root.
- Session state: Auth provider + secure store persistence.
- API policy: all calls through `src/api/client` and `src/api/modules/*` wrappers.

## Route Model
- Root layout hosts providers and group stack.
- Public layout:
  - renders public routes when unauthenticated.
  - redirects authenticated users to protected dashboard route.
- Protected layout:
  - renders protected routes when authenticated.
  - redirects unauthenticated users to login route.

## API Client Contract
- Required headers:
  - `Authorization` (when token available)
  - `X-Trace-Id` (generated per request)
  - `Idempotency-Key` (when command endpoint requires it)
- Error normalization:
  - `ApiError { status, code, message, details, traceId }`
- Verification:
  - `npm run api:verify` fails when required auth endpoints lack typed success response schemas.

## Boundary Enforcement
- ESLint `no-restricted-imports` blocks Supabase imports.
- CI boundary script blocks:
  - direct `src/api/generated/*` usage outside approved API layers.
  - cross-module internal imports across `src/modules/*` (except contracts).

## Known Constraint
- Backend Swagger currently lacks typed response payload schemas for key auth endpoints.
- Phase 1 remains open until backend fixes response schemas and `npm run api:verify` passes.
