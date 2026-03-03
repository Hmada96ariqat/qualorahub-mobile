# Phase 7 Equipment Test Evidence

## Scope
- Equipment list/detail/deactivated views
- Equipment create/edit/deactivate/reactivate/delete
- Usage log create/edit/delete
- Maintenance record create/edit/delete
- Upcoming maintenance summary

## Automated checks (current cycle)
- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run check:boundaries`
- `npm run docs:code-map`
- `npm run docs:check`

## Unit tests added
- `src/modules/equipment/__tests__/contracts.test.ts`
- `src/modules/equipment/__tests__/equipment-api.test.ts`

## API control verification (March 2, 2026)
- Auth control (`POST /auth/login`) succeeded with `hmada96ariqat@gmail.com`.
- Equipment command wrapper requirement confirmed:
  - raw payload returns `400 BAD_REQUEST` (`payload must be an object`)
  - wrapped payload (`{ "payload": ... }`) succeeds for create/update endpoints
- Deterministic equipment flow:
  - create equipment => `201`
  - patch status inactive => `200`
  - patch status operational => `200`
  - delete equipment => `200`
- Deterministic usage flow:
  - create usage log (`operator_id`, `field_id`, `usage_purpose`) => `201`
  - patch usage log => `200`
  - delete usage log => `200`
- Deterministic maintenance flow:
  - create maintenance (`service_type=preventive`, `service_description`, `date_performed`) => `201`
  - patch maintenance => `200`
  - delete maintenance => `200`

## Design + reuse evidence
- Shared component usage retained across Phase 7 screen:
  - shared layout (`AppScreen`, `AppHeader`, `AppSection`)
  - shared filters/states (`FilterBar`, `AppTabs`, `Skeleton`, `EmptyState`, `ErrorState`)
  - shared forms/overlays (`FormField`, `AppInput`, `AppSelect`, `AppDatePicker`, `BottomSheet`, `ConfirmDialog`, `ActionSheet`)
- Enterprise-dense interaction pattern applied:
  - primary action + neutral refresh action row
  - integrated per-row metadata badges
  - no detached summary-strip pattern

## Notes
- `GET /equipment` list endpoint is not currently available (`404`); list is sourced from `GET /dashboard/snapshot` equipment payload until dedicated endpoint is exposed.
- Swagger sync re-verified on March 2, 2026:
  - `npm run api:pull`, `npm run api:generate`, and `npm run api:verify` pass.
  - Equipment wrapper uses generated Equipment request/response contract aliases end-to-end.
  - `QH-OAPI-008` and `QH-OAPI-009` are closed.

## Manual smoke script (result)
- User-executed manual smoke on iOS and Android is accepted as done (March 2, 2026).
- Gate outcome: Phase 7 manual evidence is PASS.
