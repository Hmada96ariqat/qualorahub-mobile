# Dashboard API Contract (Phase 5)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Endpoint
- `GET /dashboard/snapshot`

## Runtime-observed payload shape
- Top-level object with array keys (examples):
  - `fields`
  - `lots`
  - `crops`
  - `products`
  - `productInventory`
  - `equipment`
  - `tasks`
  - `contacts`
  - `orders`
  - `productionCycles`
  - `lowStockAlerts`

## Client behavior
- Dashboard parser computes KPI totals and active/inactive splits for fields/lots.
- Refresh policy:
  - pull-to-refresh
  - manual refresh button
  - refetch on dashboard focus return

## OpenAPI schema gap (tracked)
- `QH-OAPI-005`: `DashboardReadController_getSnapshot_v1` response is untyped (`content?: never` in generated schema).

Fallback parsing is intentionally isolated in:
- `src/api/modules/dashboard.ts`
