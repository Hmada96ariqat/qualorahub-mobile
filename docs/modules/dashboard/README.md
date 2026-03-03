# Dashboard Module

## 1. Module Name
- Name: Dashboard
- Owner: Mobile
- Waterfall Phase: Phase 5

## 2. Scope
- In scope:
  - Snapshot KPI rendering from `/dashboard/snapshot`
  - Manual refresh + pull-to-refresh
  - Focus-based refresh on dashboard return
  - Module shortcuts routing
- Out of scope:
  - Dashboard charting
  - Customizable dashboard layouts/widgets

## 3. Routes and Screens
- Route path(s): `/(protected)/dashboard`
- Screen file(s): `src/modules/dashboard/screens/DashboardShell.tsx`
- Guard requirements: protected auth route + `PermissionGate` in route entry

## 4. API Surface
- Backend tag(s): `dashboard-read`
- Endpoint list:
  - `GET /api/v1/dashboard/snapshot`
- Wrapper file: `src/api/modules/dashboard.ts`
- Contract source: `src/api/generated/schema.ts`

## 5. UX States
- Loading: `Skeleton`
- Empty: `EmptyState`
- Error: `ErrorState` with retry
- Success: KPI cards and module shortcuts

## 6. Validation and Forms
- Shared validators used: none
- Module-specific validators: none

## 7. Permissions
- RBAC expectations: menu access includes `dashboard` or wildcard
- Entitlement constraints: enforced by existing auth/menu gate layer
- Read-only behavior: full dashboard view is read-only by design

## 8. Testing
- Unit tests:
  - `src/modules/dashboard/__tests__/dashboard-api.test.ts`
- Integration tests:
  - pending phase gate manual run
- E2E scenarios:
  - pending phase gate manual run
- Manual checklist:
  - pending phase gate manual run

## 9. Risks and Notes
- Risks:
  - OpenAPI snapshot response is untyped (`content?: never`)
- Assumptions:
  - Snapshot payload remains array-based by module key
- Follow-up tasks:
  - Remove parser fallback when snapshot response becomes typed (`QH-OAPI-005`)
