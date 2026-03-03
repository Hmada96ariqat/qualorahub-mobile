# QualoraHub Mobile Handoff

## Project

- Name: QualoraHub Mobile
- Stack: React Native + Expo + TypeScript
- Scope: Backoffice-first
- Authoritative execution plan: `docs/product/mobile-waterfall-plan.md`

## API source of truth

- OpenAPI file: `docs/api/openapi.json`
- Backend base URL (dev): `http://127.0.0.1:3300/api/v1`

## Hard constraints

- NestJS API only
- No Supabase direct calls
- Generated typed API layer from OpenAPI
- Shared UI components + shared hooks + shared validation (reuse first)

## Current phase status

- Active phase: Phase 14 — Hardening & Production Readiness
- Status: IMPLEMENTATION COMPLETE, GATE READY FOR SIGNOFF (manual checklist waived by user for this cycle)
- Completed gate verdicts:
  - Phase 3: PASS
  - Phase 4: PASS
  - Phase 5: PASS
  - Phase 6: PASS
  - Phase 7: PASS
  - Phase 8: PASS
  - Phase 9: PASS
  - Phase 10: PASS (manual confirmation received)
  - Phase 11: PASS
  - Phase 12: PASS (manual confirmation received)
  - Phase 13: PASS (manual gate waived by user)

## Phase 10 closure snapshot

- Manual test confirmation received from user.
- Latest automated validation snapshot remained green:
  - `npm run api:pull` => PASS
  - `npm run api:generate` => PASS
  - `npm run api:verify` => PASS
  - `npm run lint` => PASS
  - `npm run typecheck` => PASS
  - `npm run test:ci` => PASS
  - `npm run check:boundaries` => PASS
  - `npm run docs:code-map` => PASS
  - `npm run docs:check` => PASS

## Phase 11 closure summary

- OpenAPI blockers are resolved:
  - `QH-OAPI-020` closed (request DTOs typed).
  - `QH-OAPI-021` closed (2xx responses typed).
- Runtime backend blockers rechecked and resolved in latest run:
  - `PATCH /crops/{cropId}/status` with `active` -> `200`
  - `PATCH /production-cycles/{cycleId}/notes` -> `200`
  - `PATCH /production-cycles/{cycleId}/close` -> `200`
  - `GET /production-cycles/{cycleId}/summary` confirms persisted updates after patch operations.
- Additional hardening (March 2, 2026):
  - access guard behavior was hardened to fail closed when menu/entitlement snapshots cannot be loaded.
  - protected module routes were normalized to a shared `ModuleAccessGate` pattern.
  - crops module added integration test coverage for create-flow form submit wiring.
- Detailed endpoint and schema list:
  - `docs/testing/phase-11-crops-cycles-logbook.md`
  - `docs/api/crops-cycles-logbook.md`
- Latest re-validation (March 2, 2026):
  - `npm run api:pull` => PASS
  - `npm run api:generate` => PASS
  - `npm run api:verify` => PASS
  - `npm run lint` => PASS
  - `npm run typecheck` => PASS
  - `npm run test:ci` => PASS
  - `npm run check:boundaries` => PASS
  - `npm run docs:code-map` => PASS
  - `npm run docs:check` => PASS
  - Runtime probe run IDs:
    - `phase11-cyclecheck2-1772488574780`
    - `phase11-cropstatus-1772488628717`
    - `phase11-cyclenotes-1772488640613`
    - `phase11-logbookcheck-1772488615951`
    - `phase11-finalcheck-1772489515029`

## Phase 12 implementation summary (March 2, 2026)

- Backend/runtime blockers were confirmed fixed before mobile implementation:
  - crop status `active` mapping fix is live.
  - production-cycle `notes` and `close` false-404 fix is live.
  - livestock/housing/weather create/update OpenAPI typing is live.
- New Phase 12 mobile route and module:
  - `app/(protected)/livestock/index.tsx`
  - `src/modules/livestock/screens/LivestockScreen.tsx`
  - `src/modules/livestock/useLivestockModule.hook.ts`
  - `src/modules/livestock/contracts.ts`
  - `src/api/modules/livestock.ts`
- Scope implemented in module:
  - animals CRUD + group management
  - health-check and yield-record subflows
  - housing-unit CRUD + reactivate
  - housing maintenance and consumption subflows
  - weather alert rule CRUD + location rule view
- Shared reuse contract preserved:
  - `AppScreen`, `AppHeader`, `FilterBar`, `PaginationFooter`, `EmptyState`, `ErrorState`, `Skeleton`, `FormField`, `BottomSheet`, `ActionSheet`, `ConfirmDialog`
- Dashboard shortcut was extended to include `/(protected)/livestock`.
- Phase 12 tests added:
  - `src/modules/livestock/__tests__/contracts.test.ts`
  - `src/modules/livestock/__tests__/livestock-api.test.ts`
  - `src/modules/livestock/__tests__/livestock-screen.integration.test.tsx`
- Latest automated validation snapshot (March 2, 2026):
  - `npm run api:pull` => PASS
  - `npm run api:generate` => PASS
  - `npm run api:verify` => PASS
  - `npm run lint` => PASS
  - `npm run typecheck` => PASS
  - `npm run test:ci` => PASS
  - `npm run check:boundaries` => PASS
  - `npm run docs:code-map` => PASS
  - `npm run docs:check` => PASS

## Phase 13 implementation summary (March 2, 2026)

- New Phase 13 mobile route and module:
  - `app/(protected)/management/index.tsx`
  - `src/modules/management/screens/ManagementScreen.tsx`
  - `src/modules/management/useManagementModule.hook.ts`
  - `src/modules/management/contracts.ts`
  - `src/api/modules/management.ts`
- Scope implemented in module:
  - users list/update
  - role create/update/delete
  - invite create/delete
  - contacts list/create/update with server paging + search
  - storefront settings create/update essentials
  - notifications center create/read/delete
  - subscription access UX states (`full`, `read-only`, `locked-role`, `locked-subscription`)
- Shared reuse contract preserved:
  - `AppScreen`, `AppHeader`, `AppSection`, `SectionCard`, `FilterBar`, `PaginationFooter`, `EmptyState`, `ErrorState`, `Skeleton`, `FormField`, `BottomSheet`, `ConfirmDialog`
- Dashboard shortcut was extended to include `/(protected)/management`.
- Phase 13 tests added:
  - `src/modules/management/__tests__/contracts.test.ts`
  - `src/modules/management/__tests__/management-api.test.ts`
  - `src/modules/management/__tests__/management-screen.integration.test.tsx`
- Latest automated validation snapshot (March 2, 2026):
  - `npm run api:pull` => PASS
  - `npm run api:generate` => PASS
  - `npm run api:verify` => PASS
  - `npm run lint` => PASS
  - `npm run typecheck` => PASS
  - `npm run test:ci` => PASS
  - `npm run check:boundaries` => PASS
  - `npm run docs:code-map` => PASS
  - `npm run docs:check` => PASS
- Runtime verification update:
  - `PATCH /user-management/users/{profileId}` backend fix is live and verified with `200` on supported payload variants.
- Manual smoke note:
  - Manual iOS/Android smoke checklist was explicitly waived by user for this gate cycle.

## Phase 14 implementation summary (March 2, 2026)

- App-shell hardening implemented:
  - `src/providers/ObservabilityProvider.tsx`
  - `src/components/feedback/AppErrorBoundary.tsx`
  - root wiring in `app/_layout.tsx`
- API telemetry instrumentation added in:
  - `src/api/client/http.ts`
  - `src/utils/observability.ts`
- Startup/performance tuning:
  - React Query defaults hardened in `src/providers/AppQueryProvider.tsx`.
- New hardening test suites:
  - `npm run test:contracts` (`scripts/ci/run-contract-suite.mjs`)
  - `npm run test:smoke` (`scripts/ci/run-smoke-suite.mjs`)
- Release pipeline assets added:
  - `eas.json`
  - `docs/release/pipeline.md`
  - `docs/release/store-readiness-checklist.md`
  - `docs/release/incident-runbook.md`
- Phase 14 supporting tests added:
  - `src/utils/__tests__/observability.test.ts`
  - `src/components/feedback/__tests__/AppErrorBoundary.test.tsx`
  - `src/providers/__tests__/AppQueryProvider.test.tsx`
  - telemetry assertions in `src/api/client/__tests__/http.test.ts`
- Latest automated validation snapshot (March 2, 2026):
  - `npm run api:pull` => PASS
  - `npm run api:generate` => PASS
  - `npm run api:verify` => PASS
  - `npm run test:contracts` => PASS
  - `npm run test:smoke` => PASS
  - `npm run lint` => PASS
  - `npm run typecheck` => PASS
  - `npm run test:ci` => PASS
  - `npm run check:boundaries` => PASS
  - `npm run docs:code-map` => PASS
  - `npm run docs:check` => PASS

## OpenAPI blockers (tracked IDs)

- Active blockers:
  - `QH-OAPI-001`: auth request DTO schemas are empty (`LoginDto`, `RefreshTokenDto`, `LogoutDto`, `ForgotPasswordDto`, `ResetPasswordDto`).
  - `QH-OAPI-002`: subscriptions response schemas are empty (`/subscriptions/me`, `/subscriptions/me/entitlements`, `/subscriptions/me/menus`).
  - `QH-OAPI-003`: fields/lots request DTO schemas are empty.
  - `QH-OAPI-004`: fields/lots response schemas are untyped.
  - `QH-OAPI-005`: dashboard snapshot response schema is untyped.
  - `QH-OAPI-006`: tasks request DTO schemas are empty.
  - `QH-OAPI-007`: tasks response schemas are untyped.
  - `QH-OAPI-012`: `BulkHardDeleteProductsCommandDto` request schema is empty.
  - `QH-OAPI-019`: store dashboard support endpoint is untyped (`POST /products/storefront-validation`, intentionally deferred).
- Resolved in Phase 10:
  - `QH-OAPI-013`, `QH-OAPI-014`, `QH-OAPI-015`, `QH-OAPI-016`, `QH-OAPI-017`, `QH-OAPI-018`.
- Resolved in Phase 11:
  - `QH-OAPI-020`, `QH-OAPI-021`.
- Phase 12 contract caveat (untracked ID):
  - these endpoints are still emitted as `Record<string, unknown>` and are normalized in API layer:
    - `GET/POST/PATCH/DELETE /animal-groups...`
    - `GET/POST/PATCH/DELETE /animal-health-checks...`
    - `GET/POST/PATCH/DELETE /animal-yield-records...`
    - `GET/POST/PATCH/DELETE /housing-units/{housingUnitId}/maintenance-records...`
    - `GET/POST/PATCH/DELETE /housing-units/{housingUnitId}/consumption-logs...`
- Phase 13 contract caveat (untracked ID):
  - these surfaces are still emitted as `Record<string, never>` requests and/or `content?: never` responses and are normalized in API layer:
    - `GET/PATCH /user-management/users...`
    - `GET/POST/PATCH/DELETE /user-management/roles...`
    - `GET/POST/DELETE /user-management/invites...`
    - `GET/POST/PATCH /contacts...`
    - `GET/POST/PATCH /integrations/storefront/settings...`
    - `GET/POST/PATCH/DELETE /notifications...`

## Mandatory UI reuse reference

- `docs/architecture/ui-reuse-contract.md` is required for all implementation phases.
