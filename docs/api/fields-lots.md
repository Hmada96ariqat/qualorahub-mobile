# Fields & Lots API Contract (Phase 4)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Fields endpoints
- `GET /fields`
- `GET /fields/inactive/with-lots`
- `GET /fields/{fieldId}`
- `POST /fields`
- `PATCH /fields/{fieldId}`
- `PATCH /fields/{fieldId}/reactivate`

## Lots endpoints
- `GET /lots`
- `GET /lots/inactive/with-fields`
- `POST /lots`
- `PATCH /lots/{lotId}`
- `PATCH /lots/{lotId}/reactivate`

## Runtime-verified minimum request payloads

### Create field
```json
{
  "name": "Field Name",
  "area_hectares": "1.00"
}
```

### Create lot
```json
{
  "field_id": "uuid",
  "name": "Lot Name",
  "lot_type": "open_lot",
  "crop_rotation_plan": "monoculture",
  "light_profile": "full_sun"
}
```

### Deactivate
- Field: `PATCH /fields/{fieldId}` with `{ "status": "inactive" }`
- Lot: `PATCH /lots/{lotId}` with `{ "status": "inactive" }`

### Reactivate
- Field: `PATCH /fields/{fieldId}/reactivate` with `{}`
- Lot: `PATCH /lots/{lotId}/reactivate` with `{}`

## OpenAPI schema gaps (tracked)
- `QH-OAPI-003`: request DTO schemas for fields/lots are currently empty objects.
- `QH-OAPI-004`: response schemas for fields/lots are currently untyped (`content?: never` in generated schema).

Fallback parsing is intentionally isolated in:
- `src/api/modules/fields.ts`
- `src/api/modules/lots.ts`
