# QualoraHub Mobile (React Native + Expo + TypeScript) — Waterfall Delivery Plan

## 1) Summary

- Delivery model: strict waterfall. No next phase starts until current phase gate is fully passed.
- Locked defaults chosen:
  - Release scope: Backoffice first.
  - Module order: Ops core first.
  - OpenAPI source: `http://127.0.0.1:3300/api/docs-json` (env-overridable later).
  - Documentation strategy: Module+API docs plus auto-generated file-level code map docs.
- Hard rule enforced end-to-end: mobile app calls NestJS API only, no Supabase calls.

## 2) Grounded Facts From Current System (used to build this plan)

- Backend Swagger is already wired (`/api/docs`, `/api/docs-json`) and API version prefix is `/api/v1` in `main.ts`.
- Existing generated API manifest contains 382 endpoints across backend tags in `generated-endpoints.json`.
- Web route/module map is broad and already module-gated in `App.tsx`.
- Current runtime has no active Supabase calls in `src/` (only legacy comments in type file).
- Backend uses PostgreSQL migrations + optional Redis jobs; this plan keeps mobile as API consumer only (no DB direct access).

## 3) Best-Practice Mobile Folder Structure (reuse-enforced)

```text
qualorahub-mobile/
  app/                                  # Expo Router entrypoints only
    _layout.tsx
    (public)/
      auth/
      forgot-password.tsx
      reset-password.tsx
    (protected)/
      dashboard/
      fields/
      tasks/
      ...
  src/
    api/
      generated/                         # OpenAPI generated types/clients
      client/                            # single HTTP client, auth, interceptors, errors
      modules/                           # thin typed wrappers by domain tag
      contracts/                         # shared request/response contracts
    modules/                             # feature modules (one folder per module)
      auth/
      dashboard/
      fields/
      tasks/
      equipment/
      finance/
      inventory/
      orders/
      crops/
      production-cycles/
      livestock/
      users/
      contacts/
      settings/
      notifications/
    components/                          # shared UI kit only (no feature logic)
      primitives/
      form/
      feedback/
      layout/
      overlays/
      lists/
    hooks/                               # cross-feature hooks only
    theme/                               # tokens, typography, spacing, color, elevation
    utils/                               # pure helpers only
    validation/                          # shared zod schemas/validators
    state/                               # global stores (auth/session/ui)
    providers/                           # app-level providers
    constants/
    types/
  docs/
    architecture/
    api/
    modules/
    testing/
    ux/
    code-map/files/                      # generated one .md per source file
  scripts/
    api/
    docs/
    ci/
```

### Reuse Rules (non-negotiable)

- All network calls go through `src/api/client` + generated contracts.
- All screens must use shared UI kit components; no ad-hoc duplicated UI primitives.
- Feature logic stays inside `src/modules/<module>`.
- Shared hooks live in `src/hooks`; feature-specific hooks stay in module folder.
- Shared validation in `src/validation`; module-specific validation in module.
- Lint boundary rules block illegal cross-layer imports.
- CI rule blocks supabase imports/usages.

## 4) Shared Component Library (mandatory usage across screens)

- AppScreen
- AppHeader
- AppButton
- AppIconButton
- AppInput
- AppPasswordInput
- AppSearchInput
- AppSelect
- AppDatePicker
- AppTextArea
- AppCard
- AppListItem
- AppBadge
- AppChip
- AppAvatar
- AppTabs
- AppSection
- EmptyState
- ErrorState
- Skeleton
- LoadingOverlay
- ConfirmDialog
- ActionSheet
- BottomSheet
- NetworkStatusBanner
- PaginationFooter
- PullToRefreshContainer
- PermissionGate
- FormField (label + helper + error)
- ToastProvider / Snackbar

## 5) Important Public Interfaces / Types To Introduce

- ApiClient (single typed client with auth, refresh, retry, idempotency, trace headers).
- ApiError normalized envelope (`status`, `code`, `message`, `details`, `traceId`).
- AuthSession (`accessToken`, `refreshToken`, `expiresAt`, `user`).
- AuthContextSnapshot (from `/auth/context`).
- RbacSnapshot (from `/auth/rbac`).
- EntitlementsSnapshot + MenuAccessSnapshot (from subscriptions endpoints).
- ScreenState<T> (`loading | success | empty | error`).
- PaginatedResult<T> unified pagination contract used across modules.
- Module contracts file per feature: `src/modules/<module>/contracts.ts`.
- UI component prop contracts in each component folder.

## 6) Waterfall Phases (Phase 0 → Phase 14)

### Phase 0 — Discovery & Mapping (current repo, happens now)

#### Deliverables

- System map doc: web routes → mobile modules → backend endpoints → DB domain.
- API map doc from OpenAPI manifest grouped by tags and module ownership.
- UX parity audit doc: desktop flow, mobile adaptation, required simplifications.
- Risk register doc: endpoint instability, high-complexity modules, external integrations.
- Initial implementation backlog sorted by your selected order (Ops core first).

#### Test Gate Checklist

- API source verified reachable (`/api/docs-json`).
- Each target module has mapped endpoints and acceptance scenarios.
- No direct Supabase dependency in runtime path.
- Risk register has mitigation owner for each high-risk item.
- You sign off discovery artifacts before Phase 1.

### Phase 1 — Foundation (new mobile repo baseline)

#### Deliverables

- Expo + TypeScript strict project bootstrap.
- Folder structure above fully scaffolded.
- Core stack wired: Expo Router, React Query, form/validation, state, env config.
- OpenAPI pull/generate scripts and CI checks.
- Single HTTP client skeleton with auth hooks and error normalization.
- Docs baseline: architecture docs, testing docs, module templates, code-map generator.
- CI pipeline for lint, typecheck, unit tests, docs coverage, forbidden-import checks.

#### Test Gate Checklist

- App launches on iOS and Android simulator without crash.
- `lint`, `typecheck`, unit test green in CI.
- `api:generate` produces compilable types.
- Forbidden import check blocks Supabase usage.
- Docs coverage check passes for required docs.

### Phase 2 — Auth, Session, Guards

#### Deliverables

- Auth screens: login, forgot password, reset password.
- Secure token storage and refresh-token rotation flow.
- Auth bootstrap with `/auth/context`.
- RBAC + subscription entitlements bootstrap (`/auth/rbac`, `/subscriptions/me/...`).
- Protected route guard + module/menu access guard.
- Global unauthorized/session-expired handling UX.

#### Test Gate Checklist

- Login/logout works against NestJS API.
- Refresh flow works after forced token expiry.
- App restart restores valid session and routes correctly.
- Unauthorized responses trigger deterministic recovery.
- No auth flow crash in cold/warm starts.

### Phase 3 — Shared UI Kit + UX System

#### Deliverables

- Implement mandatory shared component library.
- Theme tokens and typography scale finalized.
- Form composition pattern standardized across app.
- Empty/error/loading/skeleton patterns standardized.
- Accessibility baseline (touch target, contrast, screen-reader labels).
- UI usage lint rule: no raw repeated input/button patterns in feature screens.

#### Test Gate Checklist

- All new screens use shared components only.
- Visual consistency passes design checklist.
- Accessibility smoke checks pass on key screens.
- Loading/empty/error states exist for each screen.
- No UI crashes due to missing theme/provider context.

### Phase 4 — First Full Module E2E: Fields & Lots

#### Deliverables

- Fields list/create/edit/deactivate/reactivate.
- Lots list/create/edit/deactivate/reactivate.
- Shared filters/search pattern using shared list components.
- Typed API calls via generated contracts only.
- Module docs + API contract docs completed.

#### Test Gate Checklist

- CRUD flows succeed against NestJS API.
- UI updates correctly after mutations and refresh.
- Empty/error/skeleton states validated.
- No crash during rapid create/edit/delete sequence.
- End-to-end happy path recorded and repeatable.

### Phase 5 — Dashboard Module

#### Deliverables

- Dashboard snapshot integration (`/dashboard/snapshot`).
- KPI cards, module shortcuts, refresh controls.
- Cache strategy and manual refresh policy.
- UX tuning for quick-first-load and progressive rendering.

#### Test Gate Checklist

- Snapshot fetch stable and data rendered correctly.
- Pull-to-refresh and screen return refresh behave correctly.
- No NaN/invalid metric rendering.
- Dashboard navigation routes correctly to owned modules.
- No crash under slow network simulation.

### Phase 6 — Tasks Module

#### Deliverables

- Task list/search/filter/status updates.
- Create/edit/delete tasks.
- Task comments/activity where available.
- Asset selector integration (`/tasks/assets/options`).

#### Test Gate Checklist

- Task lifecycle transitions work end-to-end.
- Filter/search accuracy verified.
- Error handling for failed updates is recoverable.
- No duplicate submission under slow tap conditions.
- No crashes with large task lists.

### Phase 7 — Equipment Module

#### Deliverables

- Equipment list/detail/deactivated views.
- Usage logs and maintenance records.
- Upcoming maintenance summary integration.

#### Test Gate Checklist

- Equipment CRUD stable.
- Usage and maintenance CRUD stable.
- Deactivate/reactivate behavior matches backend state.
- Attachments/media (if used) upload and render correctly.
- No crash when opening deep detail routes.

### Phase 8 — Finance Module

#### Deliverables

- Transactions CRUD.
- Finance groups CRUD.
- Transaction reverse flow.
- Summary cards/charts with safe numeric formatting.

#### Test Gate Checklist

- Income/expense create/edit/delete flows pass.
- Reverse transaction flow behaves correctly.
- Derived totals are correct and stable.
- No NaN/formatting defects.
- No finance screen crashes on empty datasets.

### Phase 9 — Inventory Core (Products/Categories/Taxes/Warehouses)

#### Deliverables

- Product CRUD and profile view.
- Categories, taxes, warehouses management.
- Media upload integration for product/category imagery.
- Shared selection components and reusable form schema.

#### Test Gate Checklist

- CRUD across all four entities passes.
- Product forms reuse shared validation patterns.
- Media upload/delete roundtrip works.
- Pagination/search/filter stable on large lists.
- No crash on multi-step product form.

### Phase 10 — Stock Adjustment + Orders + Store Dashboard (+ Sales Tx)

#### Deliverables

- Stock adjustment vouchers and line item flows.
- Orders list/detail/status/confirm flows.
- Store dashboard metrics.
- Sales transactions and line items where required.
- Idempotency key handling for command endpoints.

#### Test Gate Checklist

- Order confirm path is idempotent and stable.
- Stock updates are reflected correctly after order workflows.
- Status transitions validated against backend rules.
- Finance/order linkage sanity checks pass.
- No crash in long transactional flows.

### Phase 11 — Crop Planning + Production Cycles + Logbook

#### Deliverables

- Crop planning core flows.
- Production cycle list/detail/lifecycle controls.
- High-value operation flows (start with most-used operations first).
- Logbook session/catalog/submit flow integration.

#### Test Gate Checklist

- Cycle creation/update/close behaves correctly.
- Selected operation forms validate and submit correctly.
- Logbook submit writes to expected backend operations.
- No data loss when navigating between operation screens.
- No crash on dense forms and long payloads.

### Phase 12 — Livestock + Animal Housing + Weather

#### Deliverables

- Animals, groups, health checks, yield records.
- Housing units + maintenance + consumption logs.
- Weather alert rules and core weather views.

#### Test Gate Checklist

- Animal and housing CRUD paths stable.
- Health/yield/maintenance/consumption subflows stable.
- Weather rules create/edit/delete stable.
- Permission gating works for restricted users.
- No crash while switching across livestock submodules.

### Phase 13 — Users/Roles, Contacts, Settings, Notifications, Subscription Access UX

#### Deliverables

- Users and roles management flows relevant to mobile.
- Contacts management.
- Farm settings essentials.
- Notifications center and read/update flows.
- Subscription entitlement UX states (locked/read-only/upgrade prompts).

#### Test Gate Checklist

- Role-based screen/actions enforced correctly.
- Contacts/settings changes persist and rehydrate.
- Notification state transitions are accurate.
- Subscription-locked routes show correct UX.
- No crash on account/permission changes.

### Phase 14 — Hardening & Production Readiness

#### Deliverables

- Full regression pass (unit/integration/e2e).
- Contract tests against OpenAPI for implemented endpoints.
- Crash/analytics/observability wiring.
- Performance tuning and startup optimization.
- Release pipeline (build profiles, envs, signing, rollout strategy).
- App Store / Play Store readiness checklist and incident runbook.

#### Test Gate Checklist

- Crash-free sessions meet release threshold in staging.
- P0/P1 defects closed.
- End-to-end smoke suite fully green.
- API contract checks green for implemented module surface.
- Release checklist signed off.

## 7) Testing Strategy (all phases)

- Unit tests: hooks, mappers, validators, reducers/stores.
- Integration tests: screen + API mocking with contract-shaped payloads.
- Contract tests: generated client compatibility with OpenAPI schema.
- E2E tests: critical journeys per delivered module.
- Phase gate requires: API integration works, UI works, no crashes, UX pass, docs updated.

## 8) Documentation Plan (descriptive .md coverage)

- One `README.md` per module folder.
- One API contract doc per module in `docs/api`.
- One architecture doc per core layer in `docs/architecture`.
- Auto-generated file-level docs in `docs/code-map/files/<relative-path>.md` for every source file.
- CI validation fails if required docs are missing or stale.

## 9) Explicit Assumptions & Defaults

- iOS and Android both in scope from Phase 1.
- English first, i18n-ready architecture from Phase 1.
- Backoffice-first means public marketing/storefront checkout flows are deferred.
- Reports builder and public marketing/blog flows are post-MVP unless reprioritized.
- No backend schema changes are required for early phases; only consume existing APIs.
- If no override is given, OpenAPI source remains local docs-json in dev and env-driven in CI.

## 10) Inputs Requested From You After This Plan

- Share your preferred Swagger JSON URL(s) for dev/staging/prod if you want non-local generation sources.
- Confirm or edit this exact module execution order: Fields/Lots → Dashboard → Tasks → Equipment → Finance → Inventory Core → Stock/Orders/Store → Crops/Cycles/Logbook → Livestock/Housing/Weather → Users/Contacts/Settings/Notifications.
