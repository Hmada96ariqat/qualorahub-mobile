# Fields & Lots API Contract (Phase 4 + Parity Hardening)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Fields endpoints
- `GET /fields?status=<active|inactive|fallow|maintenance|all>`
- `GET /fields/inactive/with-lots`
- `GET /fields/{fieldId}`
- `POST /fields`
- `PATCH /fields/{fieldId}`
- `PATCH /fields/{fieldId}/reactivate`

## Lots endpoints
- `GET /lots?fieldId=<uuid>&status=<active|inactive|all>`
- `GET /lots/inactive/with-fields`
- `POST /lots`
- `PATCH /lots/{lotId}`
- `PATCH /lots/{lotId}/reactivate`

## Runtime-verified minimum request payloads

### Create field
```json
{
  "name": "Field Name",
  "area_hectares": 1.0,
  "area_unit": "hectares",
  "soil_type": "loam",
  "shape_polygon": {
    "type": "Polygon",
    "coordinates": [
      [
        [-89.1, 29.1],
        [-89.2, 29.1],
        [-89.2, 29.2],
        [-89.1, 29.1]
      ]
    ]
  }
}
```

### Create lot
```json
{
  "field_id": "uuid",
  "name": "Lot Name",
  "lot_type": "open_lot",
  "crop_rotation_plan": "monoculture",
  "light_profile": "full_sun",
  "weather_alerts_enabled": false,
  "status": "active"
}
```

### Field manual-area fallback payload shape
```json
{
  "shape_polygon": {
    "manual": true,
    "area": 2.5,
    "unit": "acres"
  }
}
```

### Deactivate
- Field: `PATCH /fields/{fieldId}` with `{ "status": "inactive" }`
- Lot: `PATCH /lots/{lotId}` with `{ "status": "inactive" }`

### Reactivate
- Field:
  - Main flow: `PATCH /fields/{fieldId}` with `{ "status": "active" }`
  - Deactivated list flow: `PATCH /fields/{fieldId}/reactivate` with `{}`
- Lot:
  - Main flow: `PATCH /lots/{lotId}` with `{ "status": "active" }`
  - Deactivated list flow (guarded): `PATCH /lots/{lotId}/reactivate` with `{}`

## OpenAPI schema gaps (tracked)
- `QH-OAPI-003`: request DTO schemas for fields/lots are currently empty objects.
- `QH-OAPI-004`: response schemas for fields/lots are currently untyped (`content?: never` in generated schema).

Fallback parsing is intentionally isolated in:
- `src/api/modules/fields.ts`
- `src/api/modules/lots.ts`
