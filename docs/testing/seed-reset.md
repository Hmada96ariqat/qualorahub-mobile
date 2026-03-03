# Seed and Reset (Dev)

## Scope
- This mobile repository does not own backend database seed/reset logic.
- Seed/reset is backend-owned and must be triggered in the NestJS API project.

## Required Inputs
- Backend repository path.
- Active dev database connection for backend.

## Reset Procedure
1. Stop the mobile app to avoid stale session behavior during backend reset.
2. Run backend migration reset + seed commands from the backend repo.
3. Restart backend API and verify `http://127.0.0.1:3300/api/docs-json` responds with `200`.
4. In this mobile repo, run `npm run api:sync`.
5. Clear secure storage on device/emulator, then relaunch app.

## Verification
- `POST /auth/login` succeeds for test accounts in `docs/testing/test-accounts.md`.
- `GET /auth/context` and `GET /auth/rbac` return expected snapshots.
