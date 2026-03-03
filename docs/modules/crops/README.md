# Crops + Production Cycles + Logbook Module

## 1. Module Name
- Name: Crops + Production Cycles + Logbook
- Owner: Mobile
- Waterfall Phase: Phase 11

## 2. Scope
- In scope:
  - Crop planning core flows
  - Production cycle lifecycle controls
  - High-value operation flows
  - Logbook session/catalog/submit integration
- Out of scope:
  - Phase 12 livestock/housing/weather work

## 3. Routes and Screens
- Planned route path(s): `/(protected)/crops`
- Planned screen file(s): `src/modules/crops/screens/CropsScreen.tsx`
- Guard requirements: Protected auth route + `PermissionGate` with `crops`/relevant menu key

## 4. API Surface
- Backend tags in scope:
  - `order-write` (crops + production cycles)
  - `logbook`
- Contract source: `src/api/generated/schema.ts`

## 5. Current status
- Phase 11 implementation is complete at the mobile layer and uses generated OpenAPI contracts.
- OpenAPI blockers closed:
  - `QH-OAPI-020`
  - `QH-OAPI-021`
- Runtime backend blockers (`QH-BE-CROP-001`, `QH-BE-CYCLE-001`) were rechecked and resolved in latest verification.
- See:
  - `docs/testing/phase-11-crops-cycles-logbook.md`
  - `docs/api/crops-cycles-logbook.md`
