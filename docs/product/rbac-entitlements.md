# RBAC and Entitlements

## Role Source
- `GET /auth/rbac`
- `GET /auth/context`

## Entitlement Source
- `GET /subscriptions/me/entitlements`
- `GET /subscriptions/me/menus`

## Current OpenAPI Notes (March 2, 2026)
- RBAC snapshot response (`GET /auth/rbac`) is now typed in OpenAPI.
- Subscription entitlement/menu responses are still untyped (`content?: never`) in OpenAPI and currently parsed as temporary unknown snapshots in mobile.

## Roles
- `super_admin`
- `admin`
- `manager`
- `operator`
- `viewer`

## Access Matrix (Initial Draft)
| Module | super_admin | admin | manager | operator | viewer |
|---|---|---|---|---|---|
| Dashboard | Y | Y | Y | Y | R |
| Fields & Lots | Y | Y | Y | Y | R |
| Tasks | Y | Y | Y | Y | R |
| Equipment | Y | Y | Y | Y | R |
| Finance | Y | Y | Y | N | R |
| Inventory Core | Y | Y | Y | Y | R |
| Orders / Store Dashboard | Y | Y | Y | Y | R |
| Crops / Production Cycles / Logbook | Y | Y | Y | Y | R |
| Livestock / Housing / Weather | Y | Y | Y | Y | R |
| Users / Roles | Y | Y | N | N | N |
| Contacts | Y | Y | Y | Y | R |
| Settings | Y | Y | Y | N | R |
| Notifications | Y | Y | Y | Y | R |

Legend:
- `Y` = full access
- `R` = read-only
- `N` = no access

## UX Rules
- Role denied: show permission gate state.
- Plan denied: show locked module + upgrade CTA.
- Read-only mode: disable write actions and show read-only banner.
