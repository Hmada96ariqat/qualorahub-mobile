# Tasks Module

## 1. Module Name
- Name: Tasks
- Owner: Mobile
- Waterfall Phase: Phase 6

## 2. Scope
- In scope:
  - List tasks
  - Search and status filtering
  - Create task
  - Edit task
  - Delete task
  - Status updates
  - Task asset selector integration
  - Task comments/activity read views
- Out of scope:
  - Task template management
  - Rich comment composer

## 3. Routes and Screens
- Route path(s): `/(protected)/tasks`
- Screen file(s): `src/modules/tasks/screens/TasksScreen.tsx`
- Guard requirements: Protected auth route + `PermissionGate` with `tasks` menu key

## 4. API Surface
- Backend tag(s): `order-write`
- Endpoint list:
  - `GET /api/v1/tasks`
  - `POST /api/v1/tasks`
  - `PATCH /api/v1/tasks/{taskId}`
  - `DELETE /api/v1/tasks/{taskId}`
  - `GET /api/v1/tasks/assets/options`
  - `GET /api/v1/tasks/{taskId}/comments`
  - `GET /api/v1/tasks/{taskId}/activity`
- Wrapper file: `src/api/modules/tasks.ts`
- Contract source: `src/api/generated/schema.ts`

## 5. UX States
- Loading: `Skeleton`
- Empty: `EmptyState`
- Error: `ErrorState` with retry
- Success: shared list + action sheet + form bottom sheet + details bottom sheet

## 6. Validation and Forms
- Shared validators used: none yet (Phase 6 baseline uses typed payload normalization in API layer)
- Module-specific validators: title is required before create/update

## 7. Permissions
- RBAC expectations: menu access includes `tasks` or wildcard access
- Entitlement constraints: enforced through existing `PermissionGate`
- Read-only behavior: not introduced in this phase

## 8. Testing
- Unit tests:
  - `src/modules/tasks/__tests__/contracts.test.ts`
  - `src/modules/tasks/__tests__/tasks-api.test.ts`
- Integration tests:
  - API control + screen-level integration evidence tracked in `docs/testing/phase-6-tasks.md`
- E2E scenarios:
  - Basic lifecycle API control run completed for create/update/status/comments/activity/delete
- Manual checklist:
  - Waived by user for Phase 6 signoff

## 9. Risks and Notes
- Risks:
  - OpenAPI task DTOs and responses are weak/untyped.
- Assumptions:
  - Task status accepts `pending`, `in_progress`, and `completed`.
  - Comments/activity are read-only in this phase unless backend request contracts are clarified.
- Follow-up tasks:
  - Remove fallback request unions after task DTO schemas become typed (`QH-OAPI-006`).
  - Remove fallback response parsing after task response schemas become typed (`QH-OAPI-007`).
