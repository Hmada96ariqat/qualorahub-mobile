# Inventory Module

## 1. Module Name
- Name: Inventory Core
- Owner: Mobile
- Waterfall Phase: Phase 9

## 2. Scope
- In scope:
  - Products list/create/edit/hard-delete
  - Categories list/create/edit/status change
  - Taxes list/create/edit/status change
  - Warehouses list/create/edit/status change
  - Stock-adjustment product list visibility
- Out of scope:
  - Stock adjustment voucher workflows (Phase 10)
  - Orders/store dashboard/sales transaction surfaces (Phase 10)

## 3. Routes and Screens
- Route path(s): `/(protected)/inventory`
- Screen file(s): `src/modules/inventory/screens/InventoryScreen.tsx`
- Guard requirements: protected auth route + `PermissionGate` with `inventory` menu key

## 4. API Surface
- Wrapper file: `src/api/modules/inventory.ts`
- Contract source: `src/api/generated/schema.ts`
- Endpoints:
  - `GET/POST/PATCH /api/v1/categories`
  - `GET/POST/PATCH /api/v1/taxes`
  - `GET/POST/PATCH /api/v1/warehouses`
  - `GET /api/v1/products`
  - `POST /api/v1/products`
  - `PATCH /api/v1/products/{productId}`
  - `POST /api/v1/products/commands/hard-delete`
  - `GET /api/v1/inventory/stock-adjustment/products`

## 5. UX States
- Loading: `Skeleton`
- Empty: `EmptyState`
- Error: `ErrorState` with retry
- Success: shared list rows + action sheet + bottom-sheet forms + confirm dialogs

## 6. Validation and Forms
- Shared form components:
  - `FormField`, `AppInput`, `AppSelect`, `AppTextArea`
- Module contract helpers:
  - `src/modules/inventory/contracts.ts`
- Required fields:
  - Category create: `name`
  - Tax create: `name`, `rate`
  - Warehouse create: `name`, `field_id`
  - Product create: `name`

## 7. Permissions
- Access gate: `usePermissionGate('inventory')`
- Restricted users see locked module empty state + sign-out action

## 8. Testing
- Unit tests:
  - `src/modules/inventory/__tests__/contracts.test.ts`
  - `src/modules/inventory/__tests__/inventory-api.test.ts`
- Phase test evidence:
  - `docs/testing/phase-9-inventory-core.md`

## 9. Risks and Notes
- OpenAPI still has empty request schema for hard-delete command DTO, so request fallback stays isolated in API wrapper only.
- Backend endpoint `GET /products/expired` currently returns `500`; endpoint is not used by Phase 9 mobile scope.
