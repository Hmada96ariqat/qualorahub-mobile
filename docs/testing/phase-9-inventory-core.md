# Phase 9 Inventory Core Test Evidence

## Scope
- Products: list/create/edit/status update/hard-delete command
- Categories: list/create/edit/status update
- Taxes: list/create/edit/status update
- Warehouses: list/create/edit/status update
- Stock-adjustment product options list

## Gate outcome
- Phase 9 verdict: PASS

## Automated checks (March 2, 2026)
- `npm run api:pull` => PASS
- `npm run api:generate` => PASS
- `npm run api:verify` => PASS
- `npm run lint` => PASS
- `npm run typecheck` => PASS
- `npm run test:ci` => PASS
- `npm run check:boundaries` => PASS
- `npm run docs:code-map` => PASS
- `npm run docs:check` => PASS

## Unit tests added
- `src/modules/inventory/__tests__/contracts.test.ts`
- `src/modules/inventory/__tests__/inventory-api.test.ts`

## API control verification (March 2, 2026)
Trace set: `phase9-final2-1772477069362`

- `POST /auth/login` => `201`
- `GET /categories` => `200`
- `POST /categories` => `201`
- `PATCH /categories/{categoryId}` => `200`
- `GET /taxes` => `200`
- `POST /taxes` => `201`
- `PATCH /taxes/{taxId}` => `200`
- `GET /fields` => `200` (field options for warehouse forms)
- `GET /warehouses` => `200`
- `POST /warehouses` => `201`
- `PATCH /warehouses/{warehouseId}` => `200`
- `GET /products` (canonical endpoint) => `200`
- `GET /inventory/stock-adjustment/products` => `200`
- `POST /products` => `201`
- `PATCH /products/{productId}` => `200`
- `POST /products/commands/hard-delete` => `200`

## Runtime findings
- Category create rejects `status` on create payload (`400 BAD_REQUEST` with `property status should not exist`).
  - Mobile create payload intentionally does not send `status` for create.
- `/fields` rejects pagination query parameters in current backend validation.
  - Mobile field options call uses `GET /fields` without `limit`/`offset`.
- `GET /products/expired` currently returns backend `500 INTERNAL_ERROR`.
  - Trace: `phase9-final2-1772477069362-products-expired`
  - Message: `column "expiry_date" does not exist`
  - This endpoint is not used by Phase 9 mobile flows.

## OpenAPI typing status
- Typed request DTOs are present for:
  - `CategoryCreateDto`, `CategoryUpdateDto`
  - `TaxCreateDto`, `TaxUpdateDto`
  - `WarehouseCreateDto`, `WarehouseUpdateDto`
  - `CreateProductDto`, `UpdateProductDto`
- Typed 2xx response schemas are present for Phase 9 list/create/update endpoints.
- Canonical product list endpoint (`GET /products`) is typed and used.
- Remaining typing gap:
  - `BulkHardDeleteProductsCommandDto` request schema is still empty in OpenAPI.
  - Temporary fallback is isolated in `src/api/modules/inventory.ts` only.

## Reuse and UI evidence
- Shared components in active use:
  - `AppScreen`, `AppHeader`, `AppTabs`, `AppCard`, `AppSection`
  - `FilterBar`, `AppListItem`, `PaginationFooter`, `PullToRefreshContainer`
  - `FormField`, `AppInput`, `AppSelect`, `AppTextArea`
  - `BottomSheet`, `ActionSheet`, `ConfirmDialog`
  - `Skeleton`, `EmptyState`, `ErrorState`, `AppBadge`
- Module architecture:
  - API wrappers: `src/api/modules/inventory.ts`
  - Feature contracts: `src/modules/inventory/contracts.ts`
  - Module hook: `src/modules/inventory/useInventoryModule.hook.ts`
  - Screen: `src/modules/inventory/screens/InventoryScreen.tsx`

## Manual smoke result (March 2, 2026)
- User-confirmed iOS and Android manual smoke: PASS.
- Gate manual criteria satisfied for:
  - auth + navigation into inventory route
  - tab switching (products/categories/taxes/warehouses)
  - create/edit flows per entity
  - product hard-delete flow
  - loading/empty/error state handling

## Manual smoke script (regression checklist)
Run on iOS and Android when regressions are suspected:

1. Login and navigate to Inventory.
   - Expected: route `/(protected)/inventory` opens without crash.
2. Switch tabs between Products/Categories/Taxes/Warehouses.
   - Expected: each tab renders list state with no UI crash.
3. Create then edit Category.
   - Expected: create and edit succeed; row updates after refresh.
4. Create then edit Tax.
   - Expected: create and edit succeed; updated rate/status renders correctly.
5. Create then edit Warehouse.
   - Expected: field selection works; create/edit succeed; status change persists.
6. Create then edit Product.
   - Expected: product appears in list and updates persist.
7. Hard-delete created Product.
   - Expected: delete command succeeds and product disappears after refresh.
8. Force loading/empty/error states.
   - Expected: skeleton, empty state, and error retry behavior are visible and recover correctly.

Pass criteria: all steps pass on both iOS and Android, with no crashes and correct loading/empty/error handling.
