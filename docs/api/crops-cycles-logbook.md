# Crops + Production Cycles + Logbook API Contract (Phase 11)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Contract status (March 2, 2026)
- OpenAPI contract blockers resolved:
  - `QH-OAPI-020` closed (request DTOs typed).
  - `QH-OAPI-021` closed (2xx response schemas typed).
- Latest contract refresh commands:
  - `npm run api:pull` ✅
  - `npm run api:generate` ✅
  - `npm run api:verify` ✅

## Runtime verification status
- Latest runtime verification run: `phase11-finalcheck-1772489515029`.
- `PATCH /crops/{cropId}/status` for both `inactive` and `active` returns `200`.
- `PATCH /production-cycles/{cycleId}/notes` returns `200`.
- `PATCH /production-cycles/{cycleId}/close` returns `200`.
- `GET /production-cycles/{cycleId}/summary` confirms persisted close/notes updates after patch operations.

## Primary endpoints in Phase 11 scope
- Crops:
  - `POST /crops`
  - `PATCH /crops/{cropId}`
  - `PATCH /crops/{cropId}/status`
- Production cycles:
  - `GET /production-cycles`
  - `POST /production-cycles`
  - `GET /production-cycles/{cycleId}`
  - `GET /production-cycles/{cycleId}/summary`
  - `PATCH /production-cycles/{cycleId}/close`
  - `PATCH /production-cycles/{cycleId}/notes`
  - `GET/POST /production-cycles/{cycleId}/operations`
  - `PATCH/DELETE /production-cycles/operations/{operationId}`
- Logbook:
  - `GET /logbook/session`
  - `GET /logbook/practices/catalog`
  - `POST /logbook/submit`

## Contract usage policy
- Mobile uses generated request/response types from `src/api/generated/schema.ts`.
- Network access is only through `src/api/modules/crops.ts` + shared `apiClient`.
