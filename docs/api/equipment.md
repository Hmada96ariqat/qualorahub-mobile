# Equipment API Contract (Phase 7)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Endpoints
- `GET /dashboard/snapshot` (equipment list source)
- `GET /equipment/upcoming-maintenance`
- `GET /equipment/references/operators/active`
- `GET /equipment/{equipmentId}`
- `POST /equipment`
- `PATCH /equipment/{equipmentId}`
- `DELETE /equipment/{equipmentId}`
- `GET /equipment/{equipmentId}/usage-logs`
- `POST /equipment/{equipmentId}/usage-logs`
- `PATCH /equipment/usage-logs/{usageLogId}`
- `DELETE /equipment/usage-logs/{usageLogId}`
- `GET /equipment/{equipmentId}/maintenance-records/detailed`
- `POST /equipment/{equipmentId}/maintenance-records`
- `PATCH /equipment/maintenance-records/{recordId}`
- `DELETE /equipment/maintenance-records/{recordId}`

## Runtime-verified request payloads (March 2, 2026)

All equipment write endpoints currently require a command wrapper:

```json
{
  "payload": {
    "...": "command fields"
  }
}
```

### Create equipment
```json
{
  "payload": {
    "name": "North Tractor",
    "type": "tractor",
    "status": "operational",
    "serial_number": "SN-100"
  }
}
```

### Create usage log
```json
{
  "payload": {
    "operator_id": "user-uuid",
    "field_id": "field-uuid",
    "usage_purpose": "general",
    "usage_description": "Morning pass"
  }
}
```

### Create maintenance record
```json
{
  "payload": {
    "service_type": "preventive",
    "service_description": "Oil change",
    "date_performed": "2026-03-02"
  }
}
```

### Status transitions
- Deactivate: `PATCH /equipment/{equipmentId}` with `{ "payload": { "status": "inactive" } }`
- Reactivate: `PATCH /equipment/{equipmentId}` with `{ "payload": { "status": "operational" } }`

## OpenAPI contract status (March 2, 2026)
- `npm run api:pull` and `npm run api:generate` are green against live backend Swagger.
- Equipment request and response schemas are available in generated contracts.
- Equipment API module uses generated operation contracts for request and response typing:
  - `src/api/modules/equipment.ts`
