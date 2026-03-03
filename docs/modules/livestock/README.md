# Livestock + Housing + Weather Module

## 1. Module Name
- Name: Livestock + Housing + Weather
- Owner: Mobile
- Waterfall Phase: Phase 12

## 2. Scope
- In scope:
  - Animals and animal groups lifecycle flows
  - Animal health-check and yield-record subflows
  - Housing unit lifecycle flows
  - Housing maintenance and consumption subflows
  - Weather alert rule management and location rule view
- Out of scope:
  - Phase 13 users/roles/settings/notifications flows

## 3. Routes and Screens
- Route path: `/(protected)/livestock`
- Screen file: `src/modules/livestock/screens/LivestockScreen.tsx`
- Guard requirements: Protected auth route + `ModuleAccessGate` with `livestock` menu key

## 4. API Surface
- Backend tags in scope:
  - `livestock`
- Contract source: `src/api/generated/schema.ts`
- API wrapper: `src/api/modules/livestock.ts`

## 5. Current status
- Phase 12 mobile implementation is complete and follows reuse-first shared components.
- Typed create/update OpenAPI contracts are used for:
  - animals
  - housing units
  - weather alert rules
- Partially typed Phase 12 endpoints are normalized in API layer only (`src/api/modules/livestock.ts`).
- See:
  - `docs/testing/phase-12-livestock-housing-weather.md`
  - `docs/api/livestock-housing-weather.md`
