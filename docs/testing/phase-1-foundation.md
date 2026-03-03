# Phase 1 Foundation Test Plan

## Automated Checks
- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run api:generate`
- `npm run api:verify`
- `npm run check:boundaries`
- `npm run docs:check`

## Unit Coverage
- Auth session expiration helpers:
  - `isExpired`
  - `willExpireSoon`
- API error normalization:
  - envelope extraction
  - fallback behavior
- Route guard decisions:
  - public redirect logic
  - protected redirect logic
- API request headers:
  - `X-Trace-Id`
  - `Idempotency-Key`

## Integration Coverage
- Auth provider bootstrap:
  - reads stored session
  - refreshes near-expiry token
  - writes refreshed session
- Auth lifecycle:
  - sign-in writes session
  - sign-out clears storage even after API logout call

## Manual Checks
- iOS app launch without crash.
- Android app launch without crash.
- Login happy path.
- Logout then relaunch behavior.

## Known Blocker
- `npm run api:verify` will fail until backend Swagger publishes typed response schemas for required auth endpoints.
