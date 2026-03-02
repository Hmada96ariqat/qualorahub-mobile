# Domain Glossary

## Core Entities
- Farm: Top-level tenant workspace for operations data.
- Field: Primary land unit with area, status, and metadata.
- Lot: Sub-unit under a field for operational tracking.
- Crop: Planned/active crop record tied to field/lot context.
- Production Cycle: Lifecycle record for crop operations and outcomes.
- Task: Assigned or scheduled operational work item.
- Equipment: Farm machinery/assets with usage and maintenance records.
- Product: Inventory item (input/output) with pricing and stock metadata.
- Warehouse: Storage location for inventory stock.
- Transaction: Finance record for income/expense.
- Finance Group: Group/category container for transactions.
- Order: Customer/store transaction with line items and status lifecycle.
- Animal: Livestock profile and lifecycle record.
- Animal Group: Logical grouping of animals.
- Housing Unit: Physical livestock housing structure.

## Common Status Concepts
- Active/Inactive: record availability state in module lists.
- Draft/To-do/In-progress/Completed/Cancelled: task progression.
- Pending/Confirmed/Completed/Cancelled: order progression.
- Read-only mode: subscription allows viewing but blocks write actions.

## Key Module Terms
- Entitlements: Allowed modules and plan limits for a farm.
- RBAC Snapshot: Role + permission matrix for current user.
- Menu Access: Route/menu permissions derived from subscription.
- Idempotency Key: Request key to prevent duplicate command execution.

## Finance Terms
- Income: Positive cash-in transaction.
- Expense: Cash-out transaction.
- Reversal: Opposite transaction to cancel/neutralize a prior one.
- Monthly Revenue: Sum of income over defined month window.

## Inventory Terms
- Low Stock: Quantity at or below threshold.
- Expired Product: Product with expired inventory batch/date.
- Stock Adjustment: Manual correction voucher/entry for inventory levels.
