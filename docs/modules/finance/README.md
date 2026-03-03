# Finance Module

## 1. Module Name
- Name: Finance
- Owner: Mobile
- Waterfall Phase: Phase 8

## 2. Scope
- In scope:
  - Transaction list/create/edit/delete/reverse flows
  - Finance group list/create/edit/delete flows
  - Summary metrics with safe numeric formatting
- Out of scope:
  - Sales transaction surfaces (Phase 10)
  - Finance charts beyond summary cards

## 3. Routes and Screens
- Route path(s): `/(protected)/finance`
- Screen file(s): `src/modules/finance/screens/FinanceScreen.tsx`
- Guard requirements: Protected auth route + `PermissionGate` with `finance` menu key

## 4. API Surface
- Backend tag(s): `order-write`
- Endpoint list:
  - `GET /api/v1/transactions`
  - `POST /api/v1/transactions`
  - `PATCH /api/v1/transactions/{transactionId}`
  - `DELETE /api/v1/transactions/{transactionId}`
  - `POST /api/v1/transactions/{transactionId}/commands/reverse`
  - `GET /api/v1/finance-groups`
  - `POST /api/v1/finance-groups`
  - `PATCH /api/v1/finance-groups/{financeGroupId}`
  - `DELETE /api/v1/finance-groups/{financeGroupId}`
- Wrapper file: `src/api/modules/finance.ts`
- Contract source: `src/api/generated/schema.ts`

## 5. UX States
- Loading: `Skeleton`
- Empty: `EmptyState`
- Error: `ErrorState` with retry
- Success: shared list + action sheet + bottom-sheet forms + confirm dialogs

## 6. Validation and Forms
- Shared validators used: module-level safe number/date checks for now
- Module-specific required fields:
  - Transaction: `type`, `amount`, `transaction_date`, `finance_group_id`
  - Reverse command: `reason`
  - Finance group: `name`, `type`

## 7. Permissions
- RBAC expectations: menu access includes `finance` or wildcard access
- Entitlement constraints: enforced through existing `PermissionGate`
- Read-only behavior: not introduced in this phase

## 8. Testing
- Unit tests:
  - `src/modules/finance/__tests__/contracts.test.ts`
  - `src/modules/finance/__tests__/finance-api.test.ts`
- Integration tests:
  - API control verification documented in `docs/testing/phase-8-finance.md`
- E2E scenarios:
  - Phase 8 finance CRUD + reverse + summary checks in manual script

## 9. Risks and Notes
- Risks:
  - Reversal-linked transaction deletion may require unlinking references before deleting both rows.
- Assumptions:
  - Transaction reverse requires explicit non-empty reason.
  - Finance group create/update payload uses `{ name, type }` (type is required by backend validation on update).
