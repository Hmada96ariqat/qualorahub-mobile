# Mobile Release Pipeline (Phase 14)

## Build Profiles (`eas.json`)
- `development`
  - internal distribution for local QA and debug builds.
  - uses development client.
- `preview`
  - internal distribution for staging regression and smoke checks.
  - channel: `preview`.
- `production`
  - store-ready build profile.
  - channel: `production`.
  - auto-increment enabled.

## Environment Strategy
- `EXPO_PUBLIC_API_BASE_URL` is the only required runtime API env.
- Recommended env mapping:
  - development -> local/LAN NestJS API.
  - preview -> staging NestJS API.
  - production -> production NestJS API.

## Signing Strategy
- iOS: use EAS-managed credentials for CI signing.
- Android: use EAS-managed keystore.
- Rotate signing credentials only with release manager approval.

## Rollout Strategy
1. Build preview artifacts from release branch.
2. Run smoke suite + contract suite + full automated gate.
3. Promote production build from same commit SHA.
4. Roll out in stages:
   - iOS phased release (10% -> 50% -> 100%).
   - Android staged rollout (10% -> 50% -> 100%).
5. Monitor crash and API error telemetry after each rollout step.

## Hard Stop Criteria
- Smoke suite failure.
- Contract suite failure.
- P0/P1 open issue not explicitly accepted.
- Crash/error rates exceed release threshold.
