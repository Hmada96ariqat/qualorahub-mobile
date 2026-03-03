# Tasks API Contract (Phase 6)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Endpoints
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/{taskId}`
- `DELETE /tasks/{taskId}`
- `GET /tasks/assets/options`
- `GET /tasks/{taskId}/comments`
- `GET /tasks/{taskId}/activity`

## Runtime-verified request payload (mobile baseline)

### Create task
```json
{
  "title": "Inspect Pump",
  "description": "Check pressure level",
  "status": "pending",
  "priority": "medium",
  "due_date": "2026-03-10",
  "asset_id": "asset-uuid"
}
```

### Update status
```json
{
  "status": "completed"
}
```

## Runtime verification (March 2, 2026)
- `GET /tasks` => `200`.
- `GET /tasks/assets/options` => `200`.
- `POST /tasks` + `PATCH /tasks/{taskId}` + `DELETE /tasks/{taskId}` => verified in deterministic control run.
- Asset options endpoint currently returns grouped object collections (for example `fields`, `lots`, `equipment`, `profiles`), and mobile flattens them into select options with source labels.

## OpenAPI schema gaps (tracked)
- `QH-OAPI-006`: task request DTO schemas are currently empty objects (`CreateTaskDto`, `UpdateTaskDto`).
- `QH-OAPI-007`: task responses are currently untyped (`content?: never`) for list/detail/comments/activity/asset options.

Fallback parsing is intentionally isolated in:
- `src/api/modules/tasks.ts`
