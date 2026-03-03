# Auth API Contract

## Base URLs
- Dev: `http://127.0.0.1:3300/api/v1`
- Staging: `TBD`
- Production: `TBD`

## Endpoints
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/context`
- `GET /auth/rbac`

## Current OpenAPI Notes (March 2, 2026)
- Auth responses are typed for:
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/context`
  - `GET /auth/rbac`
- Auth request DTO schemas are still emitted as empty objects in OpenAPI for:
  - `LoginDto`
  - `RefreshTokenDto`
  - `LogoutDto`
  - `ForgotPasswordDto`
  - `ResetPasswordDto`
- Mobile auth wrappers use temporary fallback request fields with TODO markers until backend request schemas are typed.

## Token Policy
- Access token TTL: `15 minutes`
- Refresh token TTL: `14 days`
- Refresh skew: `60 seconds before expiry`

## Required Headers
- `Authorization: Bearer <access_token>`
- `x-trace-id: <uuid>`
- `Idempotency-Key: <key>` (when required by command endpoints)

## Error Envelope (Expected)
Fields: `statusCode`, `code`, `message`, `details`

Example:
    {
      "statusCode": 401,
      "code": "AUTH_TOKEN_EXPIRED",
      "message": "Access token has expired",
      "details": {}
    }

## Client Behavior Rules
- On access-token expiry, attempt refresh once.
- If refresh fails, clear session and force login.
- On logout, clear local session even if API logout fails.
- Store tokens only in secure storage.
