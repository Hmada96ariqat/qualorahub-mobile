# Inventory API Contract (Phase 9)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Endpoints in use
- Categories:
  - `GET /categories`
  - `POST /categories`
  - `PATCH /categories/{categoryId}`
- Taxes:
  - `GET /taxes`
  - `POST /taxes`
  - `PATCH /taxes/{taxId}`
- Warehouses:
  - `GET /warehouses`
  - `POST /warehouses`
  - `PATCH /warehouses/{warehouseId}`
- Products:
  - `GET /products` (canonical product list)
  - `POST /products`
  - `PATCH /products/{productId}`
  - `POST /products/commands/hard-delete`
- Inventory helpers:
  - `GET /inventory/stock-adjustment/products`
  - `GET /fields` (warehouse field selector options)
  - `GET /contacts?contactTypes=supplier` (supplier selector options)
  - `GET /contacts?contactTypes=manufacturer` (manufacturer selector options)
  - `GET /crops/guidance` (crop guidance selector options)

## Product wizard payload parity (web-aligned)
- Step A (`name`, `sku`, `description`, `productType`, `otherProductType`, `usageType`, category/supplier/tax/manufacturer identity, origin/barcode/images)
- Step B (pesticide-family only: formulation, active ingredients, dose/PHI, target organisms, references, crop guidance rows)
- Step C (pricing + inventory records)

### Submit mapping rules
- `product_type <- productType`
- `other_product_type <- only when productType=other`
- `usage_type <- usageType`
- `manufacturer_id <- manufacturerId`
- `manufacturer <- resolved manufacturer name`
- `dose_unit <- doseUnitOtherText when doseUnit=other, else doseUnit`
- `crop_guidance_rows <- rows with non-empty crop_id only`
- `display_on_storefront <- forced false when usage_type=FarmInput`
- `inventoryRecords <- row-mapped command payload`

## Runtime-verified payloads (March 2, 2026)

### Category create
```json
{
  "name": "Seeds",
  "display_on_storefront": false,
  "notes": "Phase 9 category"
}
```

### Tax create
```json
{
  "name": "VAT",
  "rate": 16,
  "notes": "Standard tax"
}
```

### Warehouse create
```json
{
  "name": "Main Warehouse",
  "field_id": "11111111-1111-4111-8111-111111111111",
  "notes": "Primary warehouse"
}
```

### Product create
```json
{
  "name": "Tomato Seeds",
  "category_id": "11111111-1111-4111-8111-111111111111",
  "tax_id": "22222222-2222-4222-8222-222222222222",
  "status": "active",
  "unit": "kg",
  "sku": "SKU-001"
}
```

### Product hard-delete command
```json
{
  "ids": [
    "33333333-3333-4333-8333-333333333333"
  ]
}
```

## Behavior notes
- Category create currently rejects `status` in request payload; send status in update only.
- `/fields` currently rejects pagination query params in backend validation; use bare `GET /fields`.
- Product hard-delete uses command endpoint with `ids: string[]`.

## OpenAPI typing status (March 2, 2026)
- Typed request DTOs are present for Phase 9 create/update flows.
- Typed 2xx response schemas are present for Phase 9 list/create/update endpoints.
- Remaining gap:
  - `BulkHardDeleteProductsCommandDto` request schema is still empty in generated OpenAPI; fallback mapping remains isolated in API layer.
  - `GET /contacts` and `GET /crops/guidance` responses remain untyped (`content?: never`); selector parsing fallback remains isolated in API layer.
  - Product DTO array item schemas remain broad (`object[]`) for `images`, `active_ingredients`, `reference_urls`; mobile keeps web-compatible string array payloads in a single mapper.
