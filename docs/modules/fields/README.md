# Fields Module

## 1. Module Name
- Name: Fields
- Owner: Mobile
- Waterfall Phase: Phase 4

## 2. Scope
- In scope:
  - List active and inactive fields
  - Create field
  - Edit field
  - Deactivate/reactivate field
- Out of scope:
  - Geospatial field boundary editor
  - Advanced soil/irrigation workflows

## 3. Routes and Screens
- Route path(s): `/(protected)/fields`
- Screen file(s): `src/modules/fields/screens/FieldsScreen.tsx`
- Guard requirements: Protected auth route + `PermissionGate` with `fields` menu key

## 4. API Surface
- Backend tag(s): `order-write`
- Endpoint list:
  - `GET /api/v1/fields`
  - `GET /api/v1/fields/inactive/with-lots`
  - `GET /api/v1/fields/{fieldId}`
  - `POST /api/v1/fields`
  - `PATCH /api/v1/fields/{fieldId}`
  - `PATCH /api/v1/fields/{fieldId}/reactivate`
- Wrapper file: `src/api/modules/fields.ts`
- Contract source: `src/api/generated/schema.ts`

## 5. UX States
- Loading: `Skeleton`
- Empty: `EmptyState`
- Error: `ErrorState` with retry
- Success: shared list + form flows, pull-to-refresh, confirmation dialogs

## 6. Validation and Forms
- Shared validators used: none yet (Phase 4 baseline uses typed payload normalization in API layer)
- Module-specific validators: inline required checks for name/area in screen form

## 7. Permissions
- RBAC expectations: menu access includes `fields` or wildcard access
- Entitlement constraints: enforced through existing `PermissionGate`
- Read-only behavior: not yet introduced in this phase

## 8. Testing
- Unit tests:
  - `src/modules/fields/__tests__/contracts.test.ts`
  - `src/modules/fields/__tests__/fields-api.test.ts`
- Integration tests:
  - Screen-level manual integration currently tracked in `docs/testing/phase-4-fields-lots.md`
- E2E scenarios:
  - Pending Phase 4 gate run
- Manual checklist:
  - Pending Phase 4 gate run

## 9. Risks and Notes
- Risks:
  - OpenAPI schemas for fields requests/responses are still weak
- Assumptions:
  - Deactivation is performed via `PATCH /fields/{fieldId}` with `status=inactive`
- Follow-up tasks:
  - Remove fallback parsing once OpenAPI emits typed DTO/response contracts (`QH-OAPI-003`, `QH-OAPI-004`)
