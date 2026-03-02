# Phase 1 Checklist (Foundation)

## Architecture
- [ ] Folder structure created under `src/` (`api`, `modules`, `components`, `hooks`, `theme`, `validation`, `state`, `providers`, `utils`)
- [ ] OpenAPI generated file exists at `src/api/generated/schema.ts`
- [ ] Single API base URL is defined from env (`EXPO_PUBLIC_API_BASE_URL`)
- [ ] Rule enforced: NestJS-only API usage (no Supabase)

## Tooling
- [ ] `typecheck` passes
- [ ] `lint` passes
- [ ] `format` passes
- [ ] `api:generate` passes

## Docs
- [ ] `AGENTS.md` completed
- [ ] `docs/HANDOFF.md` completed
- [ ] `docs/api/auth.md` drafted
- [ ] `docs/product/module-priority.md` drafted
- [ ] `docs/product/acceptance-gates.md` drafted
- [ ] `docs/product/rbac-entitlements.md` drafted
- [ ] `docs/ux/screen-map.md` drafted
- [ ] `docs/data/domain-glossary.md` drafted
- [ ] `docs/testing/test-accounts.md` drafted

## Gate
- [ ] App starts successfully
- [ ] No crash on launch
- [ ] Phase 1 signoff ready
