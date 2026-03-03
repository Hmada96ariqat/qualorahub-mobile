# Lots Module

## 1. Module Name
- Name: Lots
- Owner: Mobile
- Waterfall Phase: Phase 4

## 2. Scope
- In scope:
  - List active and inactive lots
  - Create lot
  - Edit lot
  - Deactivate/reactivate lot
- Out of scope:
  - Advanced lot geospatial editing
  - Weather automation setup UX

## 3. Routes and Screens
- Route path(s): `/(protected)/lots`
- Screen file(s): `src/modules/lots/screens/LotsScreen.tsx`
- Guard requirements: Protected auth route + `PermissionGate` with `lots` menu key

## 4. API Surface
- Backend tag(s): `order-write`
- Endpoint list:
  - `GET /api/v1/lots`
  - `GET /api/v1/lots/inactive/with-fields`
  - `POST /api/v1/lots`
  - `PATCH /api/v1/lots/{lotId}`
  - `PATCH /api/v1/lots/{lotId}/reactivate`
- Wrapper file: `src/api/modules/lots.ts`
- Contract source: `src/api/generated/schema.ts`

## 5. UX States
- Loading: `Skeleton`
- Empty: `EmptyState`
- Error: `ErrorState` with retry
- Success: shared list + form flows, pull-to-refresh, confirmation dialogs

## 6. Validation and Forms
- Shared validators used: none yet (Phase 4 baseline uses typed payload normalization in API layer)
- Module-specific validators: inline required checks for field selection/name

## 7. Permissions
- RBAC expectations: menu access includes `lots` or wildcard access
- Entitlement constraints: enforced through existing `PermissionGate`
- Read-only behavior: not yet introduced in this phase

## 8. Testing
- Unit tests:
  - `src/modules/lots/__tests__/contracts.test.ts`
  - `src/modules/lots/__tests__/lots-api.test.ts`
- Integration tests:
  - Screen-level manual integration currently tracked in `docs/testing/phase-4-fields-lots.md`
- E2E scenarios:
  - Pending Phase 4 gate run
- Manual checklist:
  - Pending Phase 4 gate run

## 9. Risks and Notes
- Risks:
  - OpenAPI schemas for lots requests/responses are still weak
- Assumptions:
  - Deactivation is performed via `PATCH /lots/{lotId}` with `status=inactive`
- Follow-up tasks:
  - Remove fallback parsing once OpenAPI emits typed DTO/response contracts (`QH-OAPI-003`, `QH-OAPI-004`)
