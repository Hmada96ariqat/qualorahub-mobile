# Phase 12 Livestock + Housing + Weather Test Evidence

## Scope
- Animals CRUD and status lifecycle.
- Animal groups management.
- Animal health checks and yield record subflows.
- Housing units CRUD/reactivation.
- Housing maintenance and consumption subflows.
- Weather alert rule CRUD and location rule view.

## Gate outcome
- Phase 12 verdict: PASS (automated gate green; manual iOS/Android smoke confirmed).

## Added automated tests
- `src/modules/livestock/__tests__/contracts.test.ts`
- `src/modules/livestock/__tests__/livestock-api.test.ts`
- `src/modules/livestock/__tests__/livestock-screen.integration.test.tsx`

## Contract sync
- `npm run api:pull` => PASS
- `npm run api:generate` => PASS
- `npm run api:verify` => PASS

## Automated project checks
- `npm run lint` => PASS
- `npm run typecheck` => PASS
- `npm run test:ci` => PASS
- `npm run check:boundaries` => PASS
- `npm run docs:code-map` => PASS
- `npm run docs:check` => PASS

## Targeted phase tests
- `npm run test -- livestock` => PASS

## Manual smoke checklist (iOS + Android)
1. Open `/(protected)/livestock`.
   - Expected: screen renders with `Animals`, `Housing`, `Weather` tabs.
2. Animals tab:
   - Create + edit + deactivate animal.
   - Create + edit + deactivate group.
   - Create + edit + delete health check for selected animal.
   - Create + edit + delete yield record for selected animal.
3. Housing tab:
   - Create + edit + deactivate + reactivate housing unit.
   - Create + edit + delete maintenance record for selected housing unit.
   - Create + edit + delete consumption log for selected housing unit.
4. Weather tab:
   - Create + edit + delete weather alert rule.
   - Filter rules by lot and load location rules by location id.
5. Dashboard shortcut:
   - Open Livestock from dashboard and navigate back.

Pass criteria: no crashes, loading/empty/error states are present, actions persist and refresh correctly.
