# Livestock + Housing + Weather API Contract (Phase 12)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Endpoints in use
- Animals:
  - `GET /animals`
  - `POST /animals`
  - `PATCH /animals/{animalId}`
  - `DELETE /animals/{animalId}`
  - `GET /animals/{animalId}/health-checks`
  - `POST /animal-health-checks`
  - `PATCH /animal-health-checks/{healthCheckId}`
  - `DELETE /animal-health-checks/{healthCheckId}`
  - `GET /animals/{animalId}/yield-records`
  - `POST /animal-yield-records`
  - `PATCH /animal-yield-records/{yieldRecordId}`
  - `DELETE /animal-yield-records/{yieldRecordId}`
  - `GET /animal-groups`
  - `POST /animal-groups`
  - `PATCH /animal-groups/{groupId}`
  - `POST /animal-groups/{groupId}/commands/deactivate`
- Housing:
  - `GET /housing-units`
  - `POST /housing-units`
  - `PATCH /housing-units/{housingUnitId}`
  - `DELETE /housing-units/{housingUnitId}`
  - `POST /housing-units/{housingUnitId}/commands/reactivate`
  - `GET /housing-units/{housingUnitId}/maintenance-records`
  - `POST /housing-units/{housingUnitId}/maintenance-records`
  - `PATCH /housing-unit-maintenance-records/{maintenanceRecordId}`
  - `DELETE /housing-unit-maintenance-records/{maintenanceRecordId}`
  - `GET /housing-units/{housingUnitId}/consumption-logs`
  - `POST /housing-units/{housingUnitId}/consumption-logs`
  - `PATCH /housing-unit-consumption-logs/{consumptionLogId}`
  - `DELETE /housing-unit-consumption-logs/{consumptionLogId}`
- Weather:
  - `GET /weather-alert-rules`
  - `GET /weather-alert-rules/lot/{lotId}`
  - `GET /weather-alert-rules/location/{locationId}`
  - `POST /weather-alert-rules`
  - `PATCH /weather-alert-rules/{weatherAlertRuleId}`
  - `DELETE /weather-alert-rules/{weatherAlertRuleId}`

## Typing status from generated OpenAPI (March 2, 2026)
- Typed create/update request + success response contracts:
  - `POST /animals`, `PATCH /animals/{animalId}`
  - `POST /housing-units`, `PATCH /housing-units/{housingUnitId}`
  - `POST /weather-alert-rules`, `PATCH /weather-alert-rules/{weatherAlertRuleId}`
- Partially typed/unknown schemas (`Record<string, unknown>` in generated contracts):
  - animal groups
  - health checks
  - yield records
  - housing maintenance records
  - housing consumption logs

## Mobile handling strategy
- Typed endpoints use generated contracts directly.
- Partially typed endpoints are isolated in `src/api/modules/livestock.ts` with:
  - explicit request normalization,
  - runtime row parsing,
  - strict fallback containment in API layer only.
