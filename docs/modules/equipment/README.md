# Equipment Module

## 1. Module Name
- Name: Equipment
- Owner: Mobile
- Waterfall Phase: Phase 7

## 2. Scope
- In scope:
  - Equipment list with active/inactive views
  - Equipment create/edit/deactivate/reactivate/delete
  - Equipment detail sheet
  - Usage logs create/edit/delete
  - Maintenance records create/edit/delete
  - Upcoming maintenance summary
- Out of scope:
  - Media uploads for equipment attachments
  - Maintenance parts replacement flow

## 3. Routes and Screens
- Route path(s): `/(protected)/equipment`
- Screen file(s): `src/modules/equipment/screens/EquipmentScreen.tsx`
- Guard requirements: Protected auth route + `PermissionGate` with `equipment` menu key

## 4. API Surface
- Backend tag(s): `order-write`
- Endpoint list:
  - `GET /api/v1/dashboard/snapshot` (equipment list source)
  - `GET /api/v1/equipment/upcoming-maintenance`
  - `GET /api/v1/equipment/references/operators/active`
  - `GET /api/v1/equipment/{equipmentId}`
  - `POST /api/v1/equipment`
  - `PATCH /api/v1/equipment/{equipmentId}`
  - `DELETE /api/v1/equipment/{equipmentId}`
  - `GET /api/v1/equipment/{equipmentId}/usage-logs`
  - `POST /api/v1/equipment/{equipmentId}/usage-logs`
  - `PATCH /api/v1/equipment/usage-logs/{usageLogId}`
  - `DELETE /api/v1/equipment/usage-logs/{usageLogId}`
  - `GET /api/v1/equipment/{equipmentId}/maintenance-records/detailed`
  - `POST /api/v1/equipment/{equipmentId}/maintenance-records`
  - `PATCH /api/v1/equipment/maintenance-records/{recordId}`
  - `DELETE /api/v1/equipment/maintenance-records/{recordId}`
- Wrapper file: `src/api/modules/equipment.ts`
- Contract source: `src/api/generated/schema.ts`

## 5. UX States
- Loading: `Skeleton`
- Empty: `EmptyState`
- Error: `ErrorState` with retry
- Success: shared list + action sheet + bottom-sheet forms + confirm dialogs

## 6. Validation and Forms
- Shared validators used: none yet (Phase 7 baseline)
- Module-specific required fields:
  - Equipment: `name`
  - Usage log: `operator_id`, `field_id`, `usage_purpose`
  - Maintenance: `service_type`, `service_description`, `date_performed`

## 7. Permissions
- RBAC expectations: menu access includes `equipment` or wildcard access
- Entitlement constraints: enforced through existing `PermissionGate`
- Read-only behavior: not introduced in this phase

## 8. Testing
- Unit tests:
  - `src/modules/equipment/__tests__/contracts.test.ts`
  - `src/modules/equipment/__tests__/equipment-api.test.ts`
- Integration tests:
  - API control verification documented in `docs/testing/phase-7-equipment.md`
- E2E scenarios:
  - Equipment + usage + maintenance command flow run against local backend

## 9. Risks and Notes
- Risks:
  - `GET /equipment` list endpoint is not currently available; list is sourced from `GET /dashboard/snapshot`.
- Assumptions:
  - Equipment command endpoints require `{ payload: ... }` wrapper body.
  - Valid maintenance service types confirmed so far: `preventive`, `emergency`.
