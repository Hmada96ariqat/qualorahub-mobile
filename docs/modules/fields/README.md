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
  - Boundary map drawing with Google provider preference
  - Manual-area fallback payload when map is unavailable
  - Field details sheet with field + lot + housing overlays
- Out of scope:
  - Advanced agronomy workflows beyond current schema fields

## 3. Routes and Screens
- Route path(s): `/(protected)/fields`
- Screen file(s): `src/modules/fields/screens/FieldsScreen.tsx`
- Guard requirements: Protected auth route + `PermissionGate` with `fields` menu key

## 4. API Surface
- Backend tag(s): `order-write`
- Endpoint list:
  - `GET /api/v1/fields?status=<active|inactive|fallow|maintenance|all>`
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
- Shared validators used:
  - `src/modules/fields/validation.ts`
- Module-specific validators:
  - Boundary required unless manual fallback is enabled
  - Manual fallback area must be positive numeric
  - Create/edit UI visible fields parity with web: `name`, `soil_type`, boundary map

## 7. Permissions
- RBAC expectations: menu access includes `fields` or wildcard access
- Entitlement constraints: enforced through existing `PermissionGate`
- Read-only behavior: not yet introduced in this phase

## 8. Testing
- Unit tests:
  - `src/modules/fields/__tests__/contracts.test.ts`
  - `src/modules/fields/__tests__/fields-api.test.ts`
  - `src/modules/fields/__tests__/validation.test.ts`
- Integration tests:
  - `src/modules/fields/__tests__/fields-screen.integration.test.tsx`
- E2E scenarios:
  - Deterministic create + reactivation endpoint-path coverage in integration suite
- Manual checklist:
  - Now covered under latest parity hardening cycle in `docs/testing/phase-4-fields-lots.md`

## 9. Risks and Notes
- Risks:
  - OpenAPI schemas for fields requests/responses are still weak
- Assumptions:
  - Main-flow deactivate/reactivate uses `PATCH /fields/{fieldId}` with status payload
  - Deactivated screen reactivation uses `PATCH /fields/{fieldId}/reactivate`
- Follow-up tasks:
  - Remove fallback parsing once OpenAPI emits typed DTO/response contracts (`QH-OAPI-003`, `QH-OAPI-004`)
