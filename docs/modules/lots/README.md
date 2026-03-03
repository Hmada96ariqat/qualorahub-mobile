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
  - Three-step lot form flow (basic, boundary, notes)
  - Boundary tab is disabled until a field is selected
  - Boundary drawing validation against parent field (inside + overlap checks)
  - Point-by-point boundary blocking for outside-field and overlap attempts
  - Boundary editor fails closed when overlap context cannot be loaded
  - Immediate boundary reset when field selection changes in create/edit form
  - Deactivated-flow guard messaging when parent field is inactive
- Out of scope:
  - Weather automation authoring beyond `weather_alerts_enabled` create default

## 3. Routes and Screens
- Route path(s): `/(protected)/lots`
- Screen file(s): `src/modules/lots/screens/LotsScreen.tsx`
- Guard requirements: Protected auth route + `PermissionGate` with `lots` menu key

## 4. API Surface
- Backend tag(s): `order-write`
- Endpoint list:
  - `GET /api/v1/lots?fieldId=<uuid>&status=<active|inactive|all>`
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
- Shared validators used:
  - `src/modules/lots/validation.ts`
  - `src/modules/lots/geometry-rules.ts`
- Module-specific validators:
  - Required create fields: `field_id`, `name`, `lot_type`
  - Hidden payload defaults enforced: monoculture/full_sun/alerts false/status active
  - Boundary map stays disabled if selected field has no polygon (legacy data guard)
  - Boundary drawing remains optional; if provided, geometry rules are enforced
  - Invalid lot boundary edit reverts to last valid polygon

## 7. Permissions
- RBAC expectations: menu access includes `lots` or wildcard access
- Entitlement constraints: enforced through existing `PermissionGate`
- Read-only behavior: not yet introduced in this phase

## 8. Testing
- Unit tests:
  - `src/modules/lots/__tests__/contracts.test.ts`
  - `src/modules/lots/__tests__/lots-api.test.ts`
  - `src/modules/lots/__tests__/validation.test.ts`
  - `src/modules/lots/__tests__/geometry-rules.test.ts`
- Integration tests:
  - `src/modules/lots/__tests__/lots-screen.integration.test.tsx`
- E2E scenarios:
  - Deterministic create payload + guarded reactivation action coverage in integration suite
- Manual checklist:
  - Now covered under latest parity hardening cycle in `docs/testing/phase-4-fields-lots.md`

## 9. Risks and Notes
- Risks:
  - OpenAPI schemas for lots requests/responses are still weak
  - Legacy fields without boundary polygons block lot drawing in mobile until field geometry is fixed
- Assumptions:
  - Main-flow deactivate/reactivate uses `PATCH /lots/{lotId}` with status payload
  - Deactivated screen reactivation uses guarded `PATCH /lots/{lotId}/reactivate`
- Follow-up tasks:
  - Remove fallback parsing once OpenAPI emits typed DTO/response contracts (`QH-OAPI-003`, `QH-OAPI-004`)
