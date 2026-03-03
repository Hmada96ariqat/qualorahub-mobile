# Phase 13 Users/Roles + Contacts + Settings + Notifications Test Evidence

## Scope
- Users list/update.
- Roles create/update/delete.
- Invites create/delete.
- Contacts list/create/update with search + pagination.
- Farm storefront settings create/update essentials.
- Notifications list/create/mark-read/delete.
- Subscription access UX states (`full`, `read-only`, `locked-role`, `locked-subscription`).

## Gate outcome
- Phase 13 verdict: READY FOR SIGNOFF (automated gate green; manual iOS/Android smoke explicitly waived by user on March 2, 2026).

## Added automated tests
- `src/modules/management/__tests__/contracts.test.ts`
- `src/modules/management/__tests__/management-api.test.ts`
- `src/modules/management/__tests__/management-screen.integration.test.tsx`

## Contract sync
- `npm run api:pull` => PASS
- `npm run api:generate` => PASS
- `npm run api:verify` => PASS

## Automated project checks
- `npm run lint` => PASS
- `npm run typecheck` => PASS
- `npm run test:ci` => PASS
- `npm run check:boundaries` => PASS
- `npm run docs:code-map` => PASS
- `npm run docs:check` => PASS

## Targeted phase tests
- `npm run test -- management` => PASS

## Runtime verification update (backend fixed live)
- Endpoint: `PATCH /user-management/users/{profileId}`
- Live probe result with backend rebuild:
  - `{ full_name, nick_name, mobile_number }` => `200`
  - `{ role_id, status }` => `200`
  - mixed payload => `200`
- Mobile handling in this phase:
  - user list + user mutation flow are both active,
  - role/invite/contacts/settings/notifications flows remain active.

## Manual smoke checklist (iOS + Android)
Manual smoke execution status: WAIVED by user instruction for this gate cycle.

1. Open `/(protected)/management`.
   - Expected: screen renders tabs `Users`, `Contacts`, `Settings`, `Notifications`, `Access`.
2. Users tab:
   - Verify users list renders.
   - Edit a user and verify persisted update.
   - Create/edit/delete a role.
   - Create/delete an invite.
3. Contacts tab:
   - Search contacts.
   - Create + edit contact and verify list refresh.
   - Validate pagination controls on >1 page.
4. Settings tab:
   - Create storefront settings when absent.
   - Update delivery fee/include flag/active status when present.
5. Notifications tab:
   - Create notification (`type`, `title`, `message`).
   - Mark notification read (`read_at` patch).
   - Delete notification.
6. Access tab:
   - Verify access-state badges align with role/menu snapshot.
   - Verify subscription-locked modules display upgrade prompt.
