cat > docs/HANDOFF.md <<'EOF'

# QualoraHub Mobile Handoff

## Project

- Name: QualoraHub Mobile
- Stack: React Native + Expo + TypeScript
- Scope: Backoffice-first
- Authoritative execution plan: `docs/product/mobile-waterfall-plan.md`

## API source of truth

- OpenAPI file: `docs/api/openapi.json`
- Backend base URL (dev): `http://127.0.0.1:3300/api/v1`

## Hard constraints

- NestJS API only
- No Supabase direct calls
- Generated typed API layer from OpenAPI
- Shared UI components + shared hooks + shared validation (reuse first)

## Initial module order

1. Foundation
2. Auth
3. Shared UI kit
4. Fields/Lots
5. Dashboard
6. Tasks
7. Equipment
8. Finance
9. Inventory core(which is the stock-adjustment module)
10. Orders
11. Crops/Production Cycles/Logbook
12. Livestock/Housing/Weather
13. Users/Contacts/Settings/Notifications
14. Hardening/Release

## Phase completion gate

A phase is complete only when:

- API integration works
- UI works
- No crashes
- UX is acceptable
- Tests for that phase pass

## Mandatory UI Reuse Reference
- `docs/architecture/ui-reuse-contract.md` is required for all implementation phases.
- Do not proceed with feature work unless this contract is followed.
