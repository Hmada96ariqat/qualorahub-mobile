# Management + Access API Contract (Phase 13)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Endpoints in use
- Users/Roles:
  - `GET /user-management/users`
  - `PATCH /user-management/users/{profileId}`
  - `GET /user-management/roles`
  - `POST /user-management/roles`
  - `PATCH /user-management/roles/{roleId}`
  - `DELETE /user-management/roles/{roleId}`
  - `GET /user-management/roles/options`
  - `GET /user-management/invites`
  - `POST /user-management/invites`
  - `DELETE /user-management/invites/{inviteId}`
- Contacts:
  - `GET /contacts`
  - `POST /contacts`
  - `PATCH /contacts/{contactId}`
- Settings:
  - `GET /integrations/storefront/settings/farm`
  - `GET /integrations/storefront/settings?farmId={farmId}`
  - `POST /integrations/storefront/settings`
  - `PATCH /integrations/storefront/settings/{settingsId}`
- Notifications:
  - `GET /notifications`
  - `POST /notifications`
  - `PATCH /notifications/{notificationId}`
  - `DELETE /notifications/{notificationId}`
- Subscription UX context:
  - `GET /subscriptions/me`
  - `GET /subscriptions/me/entitlements`
  - `GET /subscriptions/me/menus`

## Runtime payload notes (March 2, 2026)
- `GET /contacts` currently returns paginated object shape:
  - `{ items, total, limit, offset }`
- `GET /integrations/storefront/settings?farmId=...` currently returns:
  - `null` when not configured
  - `{ id }` when configured
- `PATCH /integrations/storefront/settings/{settingsId}` may return nested row shape:
  - `[[{...settingsRow}], 1]`
- `POST /notifications` accepts `title`, `message`, `type` and rejects `status`.
- `PATCH /notifications/{notificationId}` accepts `read_at` and rejects `status`/`is_read`.

## OpenAPI typing status
- Generated OpenAPI request/response contracts for Phase 13 are mostly untyped (`Record<string, never>` requests and `content?: never` responses).
- Mobile strategy is fallback isolation in API layer only:
  - `src/api/modules/management.ts`
- Existing global blocker IDs remain active from prior phases (`QH-OAPI-001`, `QH-OAPI-002`, etc.).
- Phase 13 untyped contract caveat is tracked in docs (no new blocker ID assigned yet).

## Runtime verification update (March 2, 2026)
- `PATCH /user-management/users/{profileId}` is fixed and verified with live runtime probes:
  - `{ full_name, nick_name, mobile_number }` => `200`
  - `{ role_id, status }` => `200`
  - mixed payload => `200`
- Mobile Phase 13 now enables user update mutation via management Users tab.
