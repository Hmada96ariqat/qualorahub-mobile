# App Store / Play Store Readiness Checklist (Phase 14)

## Product Metadata
- [ ] App name, subtitle, and descriptions finalized.
- [ ] Privacy policy and support URL updated.
- [ ] Category, keywords, and localization metadata reviewed.

## Legal and Compliance
- [ ] Data collection disclosure reviewed (tracking, diagnostics, crash data).
- [ ] Terms/privacy links reachable from app and store listing.
- [ ] No hardcoded secrets or debug credentials in release build.

## Binary Readiness
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:ci`
- [ ] `npm run test:contracts`
- [ ] `npm run test:smoke`
- [ ] `npm run check:boundaries`
- [ ] `npm run docs:check`
- [ ] Production profile build succeeds (`eas build --profile production`).

## UX/Design Readiness
- [ ] Loading/empty/error states verified on critical modules.
- [ ] Permission-gated views verified for locked/read-only/full roles.
- [ ] No clipped primary actions on common phone widths.

## Operational Readiness
- [ ] Incident runbook reviewed with on-call owner.
- [ ] Rollback plan and release owner assigned.
- [ ] Release commit SHA documented in release ticket.
