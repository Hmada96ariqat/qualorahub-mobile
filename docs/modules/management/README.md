# Management Module

## 1. Module Name
- Name: Users/Roles + Contacts + Settings + Notifications + Subscription Access
- Owner: Mobile
- Waterfall Phase: Phase 13

## 2. Scope
- In scope:
  - Users list/update and role/invite management flows
  - Contacts list/create/update flows with search + pagination
  - Farm storefront settings essentials (create/update)
  - Notifications center create/read/delete flows
  - Subscription access UX states: full, read-only, locked-role, locked-subscription

## 3. Routes and Screens
- Route path: `/(protected)/management`
- Screen file: `src/modules/management/screens/ManagementScreen.tsx`
- Guard requirements: Protected route + `ModuleAccessGate`; route allows entry when any of users/contacts/settings/notifications is menu-allowed or role-visible so subscription-locked tabs can still render upgrade UX.

## 4. API Surface
- Backend tags/surfaces in scope:
  - `user-management`
  - `contacts`
  - `integrations/storefront/settings`
  - `notifications`
  - `subscriptions/me` (read-only UX context)
- Contract source: `src/api/generated/schema.ts`
- API wrapper: `src/api/modules/management.ts`

## 5. Current Status
- Phase 13 implementation is complete and ready for signoff.
- API fallback parsing is isolated in `src/api/modules/management.ts` due untyped OpenAPI responses/request DTOs for this phase.
- Backend probe-confirmed write flows:
  - Users update (`PATCH /user-management/users/{profileId}`)
  - Roles create/update/delete
  - Invites create/delete
  - Contacts create/update
  - Storefront settings create/update
  - Notifications create/update(read_at)/delete
