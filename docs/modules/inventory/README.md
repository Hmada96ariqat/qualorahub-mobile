# Inventory Module

## 1. Module Name
- Name: Inventory Core
- Owner: Mobile
- Waterfall Phase: Phase 9

## 2. Scope
- In scope:
  - Products list/create/edit/hard-delete
  - Product wizard parity with web for create/edit:
    - Step A: Basic Info (always shown)
    - Step B: Regulatory & Agronomic (pesticide-family product types only)
    - Step C: Pricing & Stock (always shown)
  - Product quick-add parity on relational selectors:
    - category/tax/supplier/manufacturer/warehouse create-in-place
    - parent form state preserved while child quick-add sheet is open
    - new option is auto-selected after successful create
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
  - `GET /api/v1/contacts` (supplier/manufacturer selectors; fallback parsing in API layer)
  - `GET /api/v1/crops/guidance` (crop guidance selector; fallback parsing in API layer)

## 5. UX States
- Loading: `Skeleton`
- Empty: `EmptyState`
- Error: `ErrorState` with retry
- Success: shared list rows + action sheet + bottom-sheet forms + confirm dialogs

## 6. Validation and Forms
- Shared form components:
  - `FormField`, `AppInput`, `AppSelect`, `AppTextArea`, `AppDatePicker`, `AppTabs`, `AppChip`
- Module contract helpers:
  - `src/modules/inventory/contracts.ts`
  - `src/modules/inventory/product-form.ts`
- Required fields:
  - Category create: `name`
  - Tax create: `name`, `rate`
  - Warehouse create: `name`, `field_id`
  - Product create:
    - `name`, `productType`, `usageType`
    - conditional: `doseUnitOtherText` when `doseUnit=other`
    - conditional: `phiMaxDays >= phiMinDays`

## 7. Permissions
- Access gate: `usePermissionGate('inventory')`
- Restricted users see locked module empty state + sign-out action

## 8. Testing
- Unit tests:
  - `src/modules/inventory/__tests__/contracts.test.ts`
  - `src/modules/inventory/__tests__/product-form.test.ts`
  - `src/modules/inventory/__tests__/inventory-api.test.ts`
  - `src/modules/inventory/__tests__/contact-option-resolution.test.ts`
- Phase test evidence:
  - `docs/testing/phase-9-inventory-core.md`

## 9. Risks and Notes
- OpenAPI still has empty request schema for hard-delete command DTO, so request fallback stays isolated in API wrapper only.
- OpenAPI contact and crop guidance selector responses are still untyped (`content?: never`), so parsing fallback is isolated in `src/api/modules/inventory.ts`.
- OpenAPI contact create response is still untyped (`201 content?: never`), so quick-add auto-select resolution uses deterministic ID-diff matching first, with name-based fallback in `useInventoryModule.hook.ts`.
- OpenAPI product DTO array item schemas are still `object[]` for `images`, `active_ingredients`, and `reference_urls`; submit mapper keeps web-compatible string arrays and confines type coercion to `product-form.ts`.
- Backend endpoint `GET /products/expired` currently returns `500`; endpoint is not used by Phase 9 mobile scope.
