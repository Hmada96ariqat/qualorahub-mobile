# Orders Module

## 1. Module Name
- Name: Orders + Stock Adjustment + Sales Transactions
- Owner: Mobile
- Waterfall Phase: Phase 10

## 2. Scope
- In scope:
  - Orders unread list, create, update, status update, mark-read, delete
  - Orders inventory command endpoints (`validate-inventory`, `allocate-inventory`)
  - Stock voucher list/create/update/status/delete
  - Stock voucher line item insert/delete
  - Stock-adjustment reference lookups (products, contacts, warehouses)
  - Product inventory list/create/update/delete and lookup helpers
  - Sales transactions list/create/update/complete
  - Sales transaction line list/create/update/delete
- Out of scope:
  - Storefront validation/dashboard endpoint integration (`QH-OAPI-019`, intentionally deferred)

## 3. Routes and Screens
- Route path(s): `/(protected)/orders`
- Screen file(s): `src/modules/orders/screens/OrdersScreen.tsx`
- Guard requirements: Protected auth route + `PermissionGate` with `orders` menu key

## 4. API Surface
- Backend tag(s): `order-write`
- Wrapper file: `src/api/modules/orders.ts`
- Contract source: `src/api/generated/schema.ts`

## 5. UX States
- Loading: `Skeleton`
- Empty: `EmptyState`
- Error: `ErrorState` with retry
- Success: shared list + tabs + action sheets + bottom sheets + confirm dialogs

## 6. Validation and Forms
- Shared validators used: none yet (typed normalization and guards in contracts/API wrapper)
- Module-specific validation:
  - Order create requires product + quantity + unit price
  - Voucher line insert requires product + warehouse + quantity
  - Sales line create/update requires product + warehouse + quantity + unit price

## 7. Permissions
- RBAC expectations: menu access includes `orders` or wildcard access
- Entitlement constraints: enforced through existing `PermissionGate`
- Read-only behavior: not introduced in this phase

## 8. Testing
- Unit tests:
  - `src/modules/orders/__tests__/contracts.test.ts`
  - `src/modules/orders/__tests__/orders-api.test.ts`
- Integration tests:
  - API control + screen evidence tracked in `docs/testing/phase-10-stock-orders-store.md`
- Manual checklist:
  - Pending user execution for final Phase 10 gate

## 9. Risks and Notes
- Runtime behavior note:
  - Sales line create/update requires `line_number` and `warehouse_id` in practice; UI submit flow now enforces and sends both fields.
- Assumptions:
  - Order create/confirm command endpoints require idempotency keys and current wrapper enforces them.
