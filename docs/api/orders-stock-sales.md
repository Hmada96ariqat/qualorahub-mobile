# Orders + Stock + Sales API Contract (Phase 10)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Endpoints in use
- Orders:
  - `GET /orders/context/farm`
  - `GET /orders/unread/count`
  - `GET /orders/unread`
  - `POST /orders/commands/create`
  - `PATCH /orders/{orderId}`
  - `PATCH /orders/{orderId}/status`
  - `PATCH /orders/{orderId}/read`
  - `GET /orders/{orderId}`
  - `GET /orders/{orderId}/items`
  - `GET /orders/{orderId}/stock-out`
  - `POST /orders/{orderId}/commands/confirm`
  - `POST /orders/{orderId}/commands/create-stock-out`
  - `DELETE /orders/{orderId}`
  - `POST /orders/commands/validate-inventory`
  - `POST /orders/commands/allocate-inventory`
- Stock adjustment:
  - `GET /inventory/stock-adjustment/vouchers`
  - `POST /inventory/stock-adjustment/vouchers`
  - `PATCH /inventory/stock-adjustment/vouchers/{voucherId}`
  - `PATCH /inventory/stock-adjustment/vouchers/{voucherId}/status`
  - `DELETE /inventory/stock-adjustment/vouchers/{voucherId}`
  - `POST /inventory/stock-adjustment/vouchers/{voucherId}/line-items`
  - `DELETE /inventory/stock-adjustment/vouchers/{voucherId}/line-items`
  - `GET /inventory/stock-adjustment/products`
  - `GET /inventory/stock-adjustment/contacts`
  - `GET /inventory/stock-adjustment/warehouses`
  - `GET /inventory/stock-adjustment/product-inventory`
  - `POST /inventory/stock-adjustment/product-inventory`
  - `POST /inventory/stock-adjustment/product-inventory/rows`
  - `POST /inventory/stock-adjustment/product-inventory/quantities`
  - `POST /inventory/stock-adjustment/product-inventory/find-entry`
  - `GET /inventory/stock-adjustment/product-inventory/{inventoryId}`
  - `PATCH /inventory/stock-adjustment/product-inventory/{inventoryId}`
  - `PATCH /inventory/stock-adjustment/product-inventory/{inventoryId}/quantity`
  - `DELETE /inventory/stock-adjustment/product-inventory/{inventoryId}`
- Sales transactions:
  - `GET /sales-transactions`
  - `POST /sales-transactions`
  - `GET /sales-transactions/{transactionId}`
  - `PATCH /sales-transactions/{transactionId}`
  - `POST /sales-transactions/{transactionId}/commands/complete`
  - `GET /sales-transactions/{transactionId}/lines`
  - `POST /sales-transactions/{transactionId}/lines`
  - `PATCH /sales-transactions/lines/{lineId}`
  - `DELETE /sales-transactions/lines/{lineId}`

## Runtime verification snapshot (March 2, 2026)
Trace set:
- `phase10-postfix2-1772485061765`

Verified success:
- Orders context/list/create/update/status/read/delete command flows return success.
- Orders inventory validation/allocation commands return success.
- Stock voucher create/update/line-item/delete flows return success.
- Sales transaction list/create/update/line CRUD/complete flows return success.

## Runtime behavior notes
- Sales line create/update currently need these fields to avoid runtime DB errors:
  - `line_number`
  - `warehouse_id`
- Mobile submit flow enforces both fields before calling sales line create/update.

## OpenAPI typing status
- Resolved in generated contracts:
  - `QH-OAPI-013`, `QH-OAPI-014`, `QH-OAPI-015`, `QH-OAPI-016`, `QH-OAPI-017`, `QH-OAPI-018`
- Deferred intentionally (out of Phase 10 scope):
  - `QH-OAPI-019` (`POST /products/storefront-validation`)
