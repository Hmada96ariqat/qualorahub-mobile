# Finance API Contract (Phase 8)

## Base URL
- Dev: `http://127.0.0.1:3300/api/v1`

## Endpoints in use
- `GET /transactions`
- `POST /transactions`
- `PATCH /transactions/{transactionId}`
- `DELETE /transactions/{transactionId}`
- `POST /transactions/{transactionId}/commands/reverse`
- `GET /finance-groups`
- `POST /finance-groups`
- `PATCH /finance-groups/{financeGroupId}`
- `DELETE /finance-groups/{financeGroupId}`

## Runtime-verified payloads (March 2, 2026)

### Create transaction
```json
{
  "type": "expense",
  "amount": 10,
  "transaction_date": "2026-03-02",
  "finance_group_id": "<uuid>",
  "description": "Phase 8 test"
}
```

### Reverse transaction
```json
{
  "reason": "Duplicate charge"
}
```

### Create/update finance group
```json
{
  "name": "Operations",
  "type": "expense"
}
```

## Backend behavior notes
- `POST /transactions/{transactionId}/commands/reverse` requires non-empty `reason`.
- `PATCH /finance-groups/{financeGroupId}` must include `type` with `name` in update payload.
- Reversal-linked transaction deletion may require unlinking `original_transaction_id`/`reversal_transaction_id` before deleting both records.

## OpenAPI typing status (March 2, 2026)
- Finance request DTOs are typed in generated contracts.
- Finance transaction/group endpoints include typed 2xx `content.application/json` responses.
