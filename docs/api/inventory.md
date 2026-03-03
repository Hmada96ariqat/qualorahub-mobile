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
