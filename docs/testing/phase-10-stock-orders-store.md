# Phase 10 Stock/Orders/Store Test Evidence

## Scope
- Orders: unread list/create/edit/status/read/delete + detail/items/stock-out
- Orders inventory commands: validate and allocate inventory
- Stock adjustment: vouchers + line items + inventory helpers
- Sales transactions: list/create/update/line CRUD/complete
- Storefront endpoint remains deferred and out of Phase 10 implementation scope

## Gate outcome
- Phase 10 verdict: FAIL (manual iOS/Android smoke evidence pending)

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
- `src/modules/orders/__tests__/contracts.test.ts`
- `src/modules/orders/__tests__/orders-api.test.ts`

## OpenAPI contract status
- Closed after local regeneration and verification:
  - `QH-OAPI-013` (orders request DTOs typed)
  - `QH-OAPI-014` (orders 2xx response schemas typed)
  - `QH-OAPI-015` (stock-adjustment request DTOs typed)
  - `QH-OAPI-016` (stock-adjustment 2xx response schemas typed)
  - `QH-OAPI-017` (sales request DTOs typed)
  - `QH-OAPI-018` (sales 2xx response schemas typed)
- Deferred by scope (not blocking Phase 10 backend command flows):
  - `QH-OAPI-019` (`POST /products/storefront-validation`)

## API control verification (March 2, 2026)
Trace set:
- `phase10-postfix2-1772485061765`

Results:
- `POST /auth/login` => `201`
- `GET /orders/context/farm` => `200`
- `GET /orders/unread/count` => `200`
- `GET /orders/unread` => `200`
- `POST /orders/commands/create` => `201`
- `GET /orders/{id}` => `200`
- `GET /orders/{id}/items` => `200`
- `GET /orders/{id}/stock-out` => `200`
- `POST /orders/{id}/commands/confirm` => `200`
- `PATCH /orders/{id}/status` => `200`
- `PATCH /orders/{id}/read` => `200`
- `POST /orders/commands/validate-inventory` => `201`
- `POST /orders/commands/allocate-inventory` => `201`
- `POST /orders/{id}/commands/create-stock-out` => `200`
- `DELETE /orders/{id}` => `200`
- `GET /inventory/stock-adjustment/vouchers` => `200`
- `POST /inventory/stock-adjustment/vouchers` => `201`
- `PATCH /inventory/stock-adjustment/vouchers/{id}` => `200`
- `POST /inventory/stock-adjustment/vouchers/{id}/line-items` => `201`
- `DELETE /inventory/stock-adjustment/vouchers/{id}/line-items` => `200`
- `DELETE /inventory/stock-adjustment/vouchers/{id}` => `200`
- `GET /sales-transactions` => `200`
- `POST /sales-transactions` => `201`
- `GET /sales-transactions/{id}` => `200`
- `PATCH /sales-transactions/{id}` => `200`
- `POST /sales-transactions/{id}/lines` => `201`
- `GET /sales-transactions/{id}/lines` => `200`
- `PATCH /sales-transactions/lines/{lineId}` => `200`
- `DELETE /sales-transactions/lines/{lineId}` => `200`
- `POST /sales-transactions/{id}/commands/complete` => `200`

## Runtime behavior notes
- Sales line creation currently requires these payload fields in practice:
  - `line_number`
  - `warehouse_id`
- Mobile request mapping was updated accordingly in `OrdersScreen` line-item submit flow.

## Manual smoke script (to execute on iOS + Android)
1. Login and open Orders route.
   - Expected: `/(protected)/orders` renders without crash.
2. Orders tab: create order, update status, open details, mark as read, run inventory validate/allocate, create stock-out, delete order.
   - Expected: all actions succeed, list refreshes correctly.
3. Stock tab: create voucher, update voucher, add line item, delete line items, delete voucher.
   - Expected: all actions succeed, counts and statuses refresh.
4. Sales tab: create transaction, update transaction, create line item, update line item, delete line item, complete transaction.
   - Expected: all actions succeed; complete endpoint returns success.
5. Dashboard scope check: from dashboard shortcuts open Orders route and return.
   - Expected: navigation works and no crash.

Pass criteria: all steps pass on iOS and Android with no crashes and correct loading/empty/error handling.
