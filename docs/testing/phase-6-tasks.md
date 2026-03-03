# Phase 6 Tasks Test Evidence

## Scope
- Task list/search/filter/status updates
- Task create/edit/delete flows
- Task comments/activity read flows
- Task asset selector integration

## Automated checks (current cycle)
- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run check:boundaries`
- `npm run docs:code-map`
- `npm run docs:check`

## Unit tests added
- `src/modules/tasks/__tests__/contracts.test.ts`
- `src/modules/tasks/__tests__/tasks-api.test.ts`

## Notes
- OpenAPI currently emits empty DTO/response schemas for Tasks, so request/response fallback parsing is isolated in:
  - `src/api/modules/tasks.ts`
- These fallbacks are tracked as:
  - `QH-OAPI-006` (request DTO typing gap)
  - `QH-OAPI-007` (response schema typing gap)
- `/tasks/assets/options` response shape is grouped (`fields/lots/warehouses/equipment/...`); parser flattening with source labels is implemented in `src/api/modules/tasks.ts`.

## API control verification (March 2, 2026)
- `GET /tasks` => `200` (login persona `hmada96ariqat@gmail.com`).
- `GET /tasks/assets/options` => `200`.
- Deterministic task lifecycle control run:
  - create task => success (`taskId: f0ea2952-29a2-4e14-9d8d-e701f7fe03a6`)
  - get by id => `200` (`traceId: 9e7781d2-d09b-4cab-9c48-cad8c0d6aa9a`)
  - patch update title/description => `200` (`traceId: 0612e64f-2de2-4010-88af-2ef3e30549e5`)
  - patch status => `200` (`traceId: 55b58b37-4fea-482f-9641-9d2de9022d84`)
  - comments read => `200` (`traceId: d8c63822-9945-4059-9fea-722f4f0f4b9e`)
  - activity read => `200` (`traceId: b816d76a-fef7-4fa6-a7b8-510e36900413`)
  - delete => `200` (`traceId: 93733b94-132c-48ef-82a3-14cdb5925cb9`)

## Design alignment update (Enterprise Dense)
- Top action hierarchy standardized (`Create Task` primary, `Refresh` neutral secondary).
- Task row metadata is integrated per record (status + priority badges) to improve scanability.
- Shared component reuse maintained for list/form/dialog/sheet/error/loading patterns.
- Detached summary strip pattern is intentionally not used.

## Manual QA
- Waived by user instruction for this gate.

## Phase 6 gate verdict
- Phase 6 Tasks: PASS (accepted, manual QA waived by user)
