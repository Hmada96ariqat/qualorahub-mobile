import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import {
  isRecord,
  normalizeRows,
  readArray,
  readBoolean,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';

export type ValidateInventoryRequest =
  operations['OrderWriteController_validateInventory_v1']['requestBody']['content']['application/json'];
export type AllocateInventoryRequest =
  operations['OrderWriteController_allocateInventory_v1']['requestBody']['content']['application/json'];
export type CreateOrderRequest =
  operations['OrderWriteController_createOrderCommand_v1']['requestBody']['content']['application/json'];
export type ConfirmOrderRequest =
  operations['OrderWriteController_confirmOrderCommand_v1']['requestBody']['content']['application/json'];
export type UpdateOrderStatusRequest =
  operations['OrderWriteController_updateOrderStatus_v1']['requestBody']['content']['application/json'];
export type UpdateOrderRequest =
  operations['OrderWriteController_updateOrder_v1']['requestBody']['content']['application/json'];

export type CreateStockVoucherRequest =
  operations['OrderWriteController_createStockVoucher_v1']['requestBody']['content']['application/json'];
export type UpdateStockVoucherRequest =
  operations['OrderWriteController_updateStockVoucher_v1']['requestBody']['content']['application/json'];
export type UpdateStockVoucherStatusRequest =
  operations['OrderWriteController_updateStockVoucherStatus_v1']['requestBody']['content']['application/json'];
export type InsertVoucherLineItemsRequest =
  operations['OrderWriteController_insertStockVoucherLineItems_v1']['requestBody']['content']['application/json'];
export type CreateInventoryRecordRequest =
  operations['OrderWriteController_createInventoryRecordForStockAdjustment_v1']['requestBody']['content']['application/json'];
export type ProductInventoryRowsLookupRequest =
  operations['OrderWriteController_listProductInventoryRowsForStockAdjustment_v1']['requestBody']['content']['application/json'];
export type InventoryQuantitiesLookupRequest =
  operations['OrderWriteController_listInventoryQuantitiesForStockAdjustment_v1']['requestBody']['content']['application/json'];
export type FindInventoryEntryRequest =
  operations['OrderWriteController_findInventoryRecordForEntry_v1']['requestBody']['content']['application/json'];
export type UpdateInventoryRecordRequest =
  operations['OrderWriteController_updateInventoryRecordById_v1']['requestBody']['content']['application/json'];
export type UpdateInventoryQuantityRequest =
  operations['OrderWriteController_updateInventoryQuantityById_v1']['requestBody']['content']['application/json'];

export type CreateSalesTransactionRequest =
  operations['OrderWriteController_createSalesTransaction_v1']['requestBody']['content']['application/json'];
export type UpdateSalesTransactionRequest =
  operations['OrderWriteController_updateSalesTransaction_v1']['requestBody']['content']['application/json'];
export type CreateSalesTransactionLineRequest =
  operations['OrderWriteController_createSalesTransactionLine_v1']['requestBody']['content']['application/json'];
export type UpdateSalesTransactionLineRequest =
  operations['OrderWriteController_updateSalesTransactionLine_v1']['requestBody']['content']['application/json'];

type FarmContextResponse =
  operations['OrderWriteController_getFarmContext_v1']['responses'][200]['content']['application/json'];
type UnreadOrdersCountResponse =
  operations['OrderWriteController_getUnreadOrdersCount_v1']['responses'][200]['content']['application/json'];
type UnreadOrdersResponse =
  operations['OrderWriteController_getUnreadOrders_v1']['responses'][200]['content']['application/json'];
type CreateOrderResponse =
  operations['OrderWriteController_createOrderCommand_v1']['responses'][201]['content']['application/json'];
type GetOrderResponse =
  operations['OrderWriteController_getOrderDetails_v1']['responses'][200]['content']['application/json'];
type GetOrderItemsResponse =
  operations['OrderWriteController_getOrderItems_v1']['responses'][200]['content']['application/json'];
type HasOrderStockOutResponse =
  operations['OrderWriteController_hasStockOut_v1']['responses'][200]['content']['application/json'];
type ConfirmOrderResponse =
  operations['OrderWriteController_confirmOrderCommand_v1']['responses'][200]['content']['application/json'];
type CreateStockOutResponse =
  operations['OrderWriteController_createStockOutForOrder_v1']['responses'][200]['content']['application/json'];
type UpdateOrderStatusResponse =
  operations['OrderWriteController_updateOrderStatus_v1']['responses'][200]['content']['application/json'];
type MarkOrderReadResponse =
  operations['OrderWriteController_markOrderAsRead_v1']['responses'][200]['content']['application/json'];
type UpdateOrderResponse =
  operations['OrderWriteController_updateOrder_v1']['responses'][200]['content']['application/json'];
type DeleteOrderResponse =
  operations['OrderWriteController_deleteOrder_v1']['responses'][200]['content']['application/json'];

type StockVouchersResponse =
  operations['OrderWriteController_getStockVouchers_v1']['responses'][200]['content']['application/json'];
type CreateStockVoucherResponse =
  operations['OrderWriteController_createStockVoucher_v1']['responses'][201]['content']['application/json'];
type UpdateStockVoucherResponse =
  operations['OrderWriteController_updateStockVoucher_v1']['responses'][200]['content']['application/json'];
type UpdateStockVoucherStatusResponse =
  operations['OrderWriteController_updateStockVoucherStatus_v1']['responses'][200]['content']['application/json'];
type DeleteStockVoucherResponse =
  operations['OrderWriteController_deleteStockVoucher_v1']['responses'][200]['content']['application/json'];
type InsertVoucherLineItemsResponse =
  operations['OrderWriteController_insertStockVoucherLineItems_v1']['responses'][201]['content']['application/json'];
type DeleteVoucherLineItemsResponse =
  operations['OrderWriteController_deleteStockVoucherLineItems_v1']['responses'][200]['content']['application/json'];

type StockAdjustmentProductsResponse =
  operations['OrderWriteController_listProductsForStockAdjustment_v1']['responses'][200]['content']['application/json'];
type StockAdjustmentContactsResponse =
  operations['OrderWriteController_listContactsForStockAdjustment_v1']['responses'][200]['content']['application/json'];
type StockAdjustmentWarehousesResponse =
  operations['OrderWriteController_listWarehousesForStockAdjustment_v1']['responses'][200]['content']['application/json'];
type ProductInventoryResponse =
  operations['OrderWriteController_listProductInventoryForStockAdjustment_v1']['responses'][200]['content']['application/json'];
type CreateInventoryRecordResponse =
  operations['OrderWriteController_createInventoryRecordForStockAdjustment_v1']['responses'][201]['content']['application/json'];
type ProductInventoryRowsResponse =
  operations['OrderWriteController_listProductInventoryRowsForStockAdjustment_v1']['responses'][201]['content']['application/json'];
type InventoryQuantitiesResponse =
  operations['OrderWriteController_listInventoryQuantitiesForStockAdjustment_v1']['responses'][201]['content']['application/json'];
type FindInventoryEntryResponse =
  operations['OrderWriteController_findInventoryRecordForEntry_v1']['responses'][201]['content']['application/json'];
type InventoryBatchByIdResponse =
  operations['OrderWriteController_findInventoryBatchById_v1']['responses'][200]['content']['application/json'];
type UpdateInventoryRecordResponse =
  operations['OrderWriteController_updateInventoryRecordById_v1']['responses'][200]['content']['application/json'];
type UpdateInventoryQuantityResponse =
  operations['OrderWriteController_updateInventoryQuantityById_v1']['responses'][200]['content']['application/json'];
type DeleteInventoryRecordResponse =
  operations['OrderWriteController_deleteInventoryRecordById_v1']['responses'][200]['content']['application/json'];

type SalesTransactionsResponse =
  operations['OrderWriteController_listSalesTransactions_v1']['responses'][200]['content']['application/json'];
type CreateSalesTransactionResponse =
  operations['OrderWriteController_createSalesTransaction_v1']['responses'][201]['content']['application/json'];
type GetSalesTransactionResponse =
  operations['OrderWriteController_getSalesTransactionById_v1']['responses'][200]['content']['application/json'];
type UpdateSalesTransactionResponse =
  operations['OrderWriteController_updateSalesTransaction_v1']['responses'][200]['content']['application/json'];
type CompleteSalesTransactionResponse =
  operations['OrderWriteController_completeSalesTransaction_v1']['responses'][200]['content']['application/json'];
type SalesTransactionLinesResponse =
  operations['OrderWriteController_listSalesTransactionLines_v1']['responses'][200]['content']['application/json'];
type CreateSalesTransactionLineResponse =
  operations['OrderWriteController_createSalesTransactionLine_v1']['responses'][201]['content']['application/json'];
type UpdateSalesTransactionLineResponse =
  operations['OrderWriteController_updateSalesTransactionLine_v1']['responses'][200]['content']['application/json'];
type DeleteSalesTransactionLineResponse =
  operations['OrderWriteController_deleteSalesTransactionLine_v1']['responses'][200]['content']['application/json'];

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | string;

export type StockVoucherStatus = 'draft' | 'posted' | 'completed' | string;
export type StockVoucherType = 'entry' | 'out' | string;
export type SalesTransactionStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | string;

export type FarmContext = {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string | null;
  totalAmount: number;
  subtotal: number | null;
  orderDate: string | null;
  deliveryDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  contactId: string | null;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
  itemsCount: number;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type StockVoucher = {
  id: string;
  type: StockVoucherType;
  status: StockVoucherStatus;
  contactId: string | null;
  voucherDate: string | null;
  voucherReference: string | null;
  notes: string | null;
  sourceType: string | null;
  createdAt: string;
  updatedAt: string;
  lineItemsCount: number;
};

export type StockVoucherLineItem = {
  id: string;
  voucherId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  batchNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
};

export type StockAdjustmentProductOption = {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  status: string;
};

export type StockAdjustmentContactOption = {
  id: string;
  name: string;
  company: string | null;
  type: string | null;
  status: string | null;
};

export type StockAdjustmentWarehouseOption = {
  id: string;
  name: string;
  status: string;
  capacityValue: number | null;
  capacityUnit: string | null;
};

export type ProductInventoryRecord = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  batchNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  notes: string | null;
};

export type InventoryRowSummary = {
  productId: string;
  warehouseId: string;
  quantity: number;
  warehouseName: string | null;
};

export type InventoryQuantitySummary = {
  productId: string;
  warehouseId: string;
  quantity: number;
};

export type SalesTransaction = {
  id: string;
  status: SalesTransactionStatus;
  transactionDate: string | null;
  priceType: string | null;
  contactId: string | null;
  notes: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type SalesTransactionLine = {
  id: string;
  transactionId: string;
  lineNumber: number;
  productId: string | null;
  productName: string;
  warehouseId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isLocked: boolean;
};

function readFirstString(record: UnknownRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = readString(record, key);
    if (value.length > 0) return value;
  }
  return fallback;
}

function readFirstNullableString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = readNullableString(record, key);
    if (value !== null) return value;
  }
  return null;
}

function readNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = readNullableNumber(value);
  return parsed ?? fallback;
}

function parseList<T>(payload: unknown, parser: (value: unknown) => T | null): T[] {
  return normalizeRows(payload)
    .map((item) => parser(item))
    .filter((item): item is T => Boolean(item));
}

function parseFirst<T>(payload: unknown, parser: (value: unknown) => T | null, errorText: string): T {
  const rows = parseList(payload, parser);
  if (rows.length === 0) throw new Error(errorText);
  return rows[0];
}

function normalizeRowShape(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;

  if (isRecord(payload.transaction)) return payload.transaction;
  if (isRecord(payload.order)) return payload.order;
  if (isRecord(payload.row)) return payload.row;

  return payload;
}

function parseFarmContext(payload: unknown): FarmContext | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name', 'Farm'),
    slug: readString(payload, 'slug'),
    subscriptionStatus: readFirstNullableString(payload, ['subscription_status']),
    subscriptionPlan: readFirstNullableString(payload, ['subscription_plan']),
  };
}

function parseOrder(payload: unknown): OrderSummary | null {
  const row = normalizeRowShape(payload);
  if (!isRecord(row)) return null;

  const id = readString(row, 'id');
  if (!id) return null;

  const itemRows = readArray(row, 'order_items');

  return {
    id,
    orderNumber: readFirstString(row, ['order_number', 'orderNumber'], 'n/a'),
    status: readFirstString(row, ['status'], 'pending'),
    customerName: readFirstNullableString(row, ['customer_name', 'customerName']),
    totalAmount: readNumber(row.total_amount),
    subtotal: readNullableNumber(row.subtotal),
    orderDate: readFirstNullableString(row, ['order_date']),
    deliveryDate: readFirstNullableString(row, ['delivery_date']),
    paymentMethod: readFirstNullableString(row, ['payment_method']),
    notes: readFirstNullableString(row, ['notes']),
    contactId: readFirstNullableString(row, ['contact_id', 'customer_id']),
    createdAt: readFirstString(row, ['created_at', 'createdAt']),
    updatedAt: readFirstString(row, ['updated_at', 'updatedAt']),
    readAt: readFirstNullableString(row, ['read_at']),
    itemsCount:
      readNumber((row as UnknownRecord).order_items_count, itemRows.length) || itemRows.length,
  };
}

function parseOrderItem(payload: unknown): OrderItem | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    orderId: readString(payload, 'order_id'),
    productId: readFirstNullableString(payload, ['product_id']),
    productName: readFirstString(payload, ['product_name', 'name'], 'Product'),
    quantity: readNumber(payload.quantity),
    unitPrice: readNumber(payload.unit_price),
    totalPrice: readNumber(payload.total_price, readNumber(payload.quantity) * readNumber(payload.unit_price)),
  };
}

function parseStockVoucher(payload: unknown): StockVoucher | null {
  const row = normalizeRowShape(payload);
  if (!isRecord(row)) return null;
  const id = readString(row, 'id');
  if (!id) return null;

  const lineItems = readArray(row, 'line_items');

  return {
    id,
    type: readFirstString(row, ['type'], 'entry'),
    status: readFirstString(row, ['status'], 'draft'),
    contactId: readFirstNullableString(row, ['contact_id']),
    voucherDate: readFirstNullableString(row, ['voucher_date']),
    voucherReference: readFirstNullableString(row, ['voucher_reference']),
    notes: readFirstNullableString(row, ['notes']),
    sourceType: readFirstNullableString(row, ['source_type']),
    createdAt: readFirstString(row, ['created_at', 'createdAt']),
    updatedAt: readFirstString(row, ['updated_at', 'updatedAt']),
    lineItemsCount:
      readNumber((row as UnknownRecord).line_items_count, lineItems.length) || lineItems.length,
  };
}

function parseVoucherLineItem(payload: unknown): StockVoucherLineItem | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    voucherId: readString(payload, 'voucher_id'),
    productId: readString(payload, 'product_id'),
    warehouseId: readString(payload, 'warehouse_id'),
    quantity: readNumber(payload.quantity),
    batchNumber: readFirstNullableString(payload, ['batch_number']),
    manufacturingDate: readFirstNullableString(payload, ['manufacturing_date']),
    expiryDate: readFirstNullableString(payload, ['expiry_date']),
  };
}

function parseStockProductOption(payload: unknown): StockAdjustmentProductOption | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name', 'Product'),
    sku: readFirstNullableString(payload, ['sku']),
    unit: readFirstNullableString(payload, ['unit']),
    status: readFirstString(payload, ['status'], 'active'),
  };
}

function parseStockContactOption(payload: unknown): StockAdjustmentContactOption | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name', 'Contact'),
    company: readFirstNullableString(payload, ['company']),
    type: readFirstNullableString(payload, ['type']),
    status: readFirstNullableString(payload, ['status']),
  };
}

function parseStockWarehouseOption(payload: unknown): StockAdjustmentWarehouseOption | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name', 'Warehouse'),
    status: readFirstString(payload, ['status'], 'active'),
    capacityValue: readNullableNumber(payload.capacity_value),
    capacityUnit: readFirstNullableString(payload, ['capacity_unit']),
  };
}

function parseInventoryRecord(payload: unknown): ProductInventoryRecord | null {
  const row = normalizeRowShape(payload);
  if (!isRecord(row)) return null;
  const id = readString(row, 'id');
  if (!id) return null;

  return {
    id,
    productId: readString(row, 'product_id'),
    warehouseId: readString(row, 'warehouse_id'),
    quantity: readNumber(row.quantity),
    batchNumber: readFirstNullableString(row, ['batch_number']),
    manufacturingDate: readFirstNullableString(row, ['manufacturing_date']),
    expiryDate: readFirstNullableString(row, ['expiry_date']),
    notes: readFirstNullableString(row, ['notes']),
  };
}

function parseInventoryRowSummary(payload: unknown): InventoryRowSummary | null {
  if (!isRecord(payload)) return null;
  const productId = readString(payload, 'product_id');
  const warehouseId = readString(payload, 'warehouse_id');
  if (!productId || !warehouseId) return null;

  const warehouse = isRecord(payload.warehouse) ? payload.warehouse : null;

  return {
    productId,
    warehouseId,
    quantity: readNumber(payload.quantity),
    warehouseName: warehouse ? readString(warehouse, 'name') : null,
  };
}

function parseInventoryQuantitySummary(payload: unknown): InventoryQuantitySummary | null {
  if (!isRecord(payload)) return null;
  const productId = readString(payload, 'product_id');
  const warehouseId = readString(payload, 'warehouse_id');
  if (!productId || !warehouseId) return null;

  return {
    productId,
    warehouseId,
    quantity: readNumber(payload.quantity),
  };
}

function parseSalesTransaction(payload: unknown): SalesTransaction | null {
  const row = normalizeRowShape(payload);
  if (!isRecord(row)) return null;
  const id = readString(row, 'id');
  if (!id) return null;

  return {
    id,
    status: readFirstString(row, ['status'], 'pending'),
    transactionDate: readFirstNullableString(row, ['transaction_date']),
    priceType: readFirstNullableString(row, ['price_type']),
    contactId: readFirstNullableString(row, ['contact_id']),
    notes: readFirstNullableString(row, ['notes']),
    subtotal: readNullableNumber(row.subtotal),
    taxAmount: readNullableNumber(row.tax_amount),
    totalAmount: readNullableNumber(row.total_amount),
    createdAt: readFirstString(row, ['created_at', 'createdAt']),
    updatedAt: readFirstString(row, ['updated_at', 'updatedAt']),
  };
}

function parseSalesTransactionLine(payload: unknown): SalesTransactionLine | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    transactionId: readString(payload, 'transaction_id'),
    lineNumber: readNumber(payload.line_number),
    productId: readFirstNullableString(payload, ['product_id']),
    productName: readFirstString(payload, ['product_name'], 'Product'),
    warehouseId: readFirstNullableString(payload, ['warehouse_id']),
    quantity: readNumber(payload.quantity),
    unitPrice: readNumber(payload.unit_price),
    subtotal: readNumber(payload.subtotal),
    isLocked: readBoolean(payload, 'is_locked'),
  };
}

function normalizeOrderItems(items: unknown): CreateOrderRequest['order_items'] {
  const rows = Array.isArray(items) ? items : [];
  const normalized = rows
    .map((row) => {
      if (!isRecord(row)) return null;
      const productId = readString(row, 'product_id');
      if (!productId) return null;
      return {
        product_id: productId,
        product_name: readString(row, 'product_name', 'Product'),
        quantity: readNumber(row.quantity),
        unit_price: readNumber(row.unit_price),
      };
    })
    .filter((row): row is CreateOrderRequest['order_items'][number] => Boolean(row));

  return normalized;
}

function normalizeCreateOrderRequest(input: CreateOrderRequest): CreateOrderRequest {
  const row: UnknownRecord = isRecord(input) ? input : {};
  return {
    status: readFirstString(row, ['status'], 'pending') as CreateOrderRequest['status'],
    contact_id: readFirstNullableString(row, ['contact_id']) ?? undefined,
    subtotal: readNullableNumber(row.subtotal) ?? undefined,
    total_amount: readNullableNumber(row.total_amount) ?? undefined,
    order_date: readFirstNullableString(row, ['order_date']) ?? undefined,
    delivery_date: readFirstNullableString(row, ['delivery_date']) ?? undefined,
    shipping_address: readFirstNullableString(row, ['shipping_address']) ?? undefined,
    customer_name: readFirstNullableString(row, ['customer_name']) ?? undefined,
    customer_email: readFirstNullableString(row, ['customer_email']) ?? undefined,
    customer_phone: readFirstNullableString(row, ['customer_phone']) ?? undefined,
    customer_address: readFirstNullableString(row, ['customer_address']) ?? undefined,
    customer_city: readFirstNullableString(row, ['customer_city']) ?? undefined,
    customer_postal_code: readFirstNullableString(row, ['customer_postal_code']) ?? undefined,
    delivery_method: readFirstNullableString(row, ['delivery_method']) ?? undefined,
    payment_method: readFirstNullableString(row, ['payment_method']) ?? undefined,
    source: readFirstNullableString(row, ['source']) ?? undefined,
    notes: readFirstNullableString(row, ['notes']) ?? undefined,
    order_items: normalizeOrderItems(row.order_items),
  };
}

function normalizeConfirmOrderRequest(input: ConfirmOrderRequest): ConfirmOrderRequest {
  const row: UnknownRecord = isRecord(input) ? input : {};
  return {
    note: readFirstNullableString(row, ['note']) ?? undefined,
  };
}

export async function getOrdersFarmContext(token: string): Promise<FarmContext | null> {
  const { data } = await apiClient.get<FarmContextResponse>('/orders/context/farm', { token });
  return parseFarmContext(data);
}

export async function getUnreadOrdersCount(token: string): Promise<number> {
  const { data } = await apiClient.get<UnreadOrdersCountResponse>('/orders/unread/count', { token });
  return isRecord(data) ? readNumber(data.count) : 0;
}

export async function listUnreadOrders(token: string): Promise<OrderSummary[]> {
  const { data } = await apiClient.get<UnreadOrdersResponse>('/orders/unread', { token });
  return parseList(data, parseOrder);
}

export async function createOrder(token: string, input: CreateOrderRequest): Promise<OrderSummary> {
  const requestBody = normalizeCreateOrderRequest(input);
  if (!Array.isArray(requestBody.order_items) || requestBody.order_items.length === 0) {
    throw new Error('Order requires at least one order item.');
  }

  const { data } = await apiClient.post<CreateOrderResponse, CreateOrderRequest>('/orders/commands/create', {
    token,
    headers: { 'x-phase6-failure-mode': 'none' },
    body: requestBody,
    idempotencyKey: `orders-create-${Date.now()}`,
  });

  return parseFirst(data, parseOrder, 'Orders API returned an empty create payload.');
}

export async function getOrderDetails(token: string, orderId: string): Promise<OrderSummary | null> {
  const { data } = await apiClient.get<GetOrderResponse>(`/orders/${orderId}`, { token });
  return parseOrder(data);
}

export async function getOrderItems(token: string, orderId: string): Promise<OrderItem[]> {
  const { data } = await apiClient.get<GetOrderItemsResponse>(`/orders/${orderId}/items`, { token });
  return parseList(data, parseOrderItem);
}

export async function hasOrderStockOut(token: string, orderId: string): Promise<boolean> {
  const { data } = await apiClient.get<HasOrderStockOutResponse>(`/orders/${orderId}/stock-out`, { token });
  return isRecord(data) ? readBoolean(data, 'hasStockOut') : false;
}

export async function confirmOrder(token: string, orderId: string, input: ConfirmOrderRequest): Promise<OrderSummary> {
  const { data } = await apiClient.post<ConfirmOrderResponse, ConfirmOrderRequest>(
    `/orders/${orderId}/commands/confirm`,
    {
      token,
      headers: { 'x-phase6-failure-mode': 'none' },
      body: normalizeConfirmOrderRequest(input),
      idempotencyKey: `orders-confirm-${orderId}-${Date.now()}`,
    },
  );

  return parseFirst(data, parseOrder, 'Orders API returned an empty confirm payload.');
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  input: UpdateOrderStatusRequest,
): Promise<OrderSummary> {
  const { data } = await apiClient.patch<UpdateOrderStatusResponse, UpdateOrderStatusRequest>(
    `/orders/${orderId}/status`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseOrder, 'Orders API returned an empty status payload.');
}

export async function updateOrder(token: string, orderId: string, input: UpdateOrderRequest): Promise<OrderSummary> {
  const { data } = await apiClient.patch<UpdateOrderResponse, UpdateOrderRequest>(`/orders/${orderId}`, {
    token,
    body: input,
  });

  return parseFirst(data, parseOrder, 'Orders API returned an empty update payload.');
}

export async function markOrderAsRead(token: string, orderId: string): Promise<OrderSummary | null> {
  const { data } = await apiClient.patch<MarkOrderReadResponse>(`/orders/${orderId}/read`, { token });
  return parseOrder(data);
}

export async function createStockOutForOrder(token: string, orderId: string): Promise<OrderSummary | null> {
  const { data } = await apiClient.post<CreateStockOutResponse>(`/orders/${orderId}/commands/create-stock-out`, {
    token,
    idempotencyKey: `orders-create-stock-out-${orderId}-${Date.now()}`,
  });

  return parseOrder(data);
}

export async function deleteOrder(token: string, orderId: string): Promise<boolean> {
  const { data } = await apiClient.delete<DeleteOrderResponse>(`/orders/${orderId}`, { token });
  return isRecord(data) ? readBoolean(data, 'deleted') : false;
}

// Response body for these two endpoints is still empty (201 with no JSON payload).
export async function validateOrderInventory(token: string, input: ValidateInventoryRequest): Promise<void> {
  await apiClient.post<operations['OrderWriteController_validateInventory_v1']['responses'][201], ValidateInventoryRequest>(
    '/orders/commands/validate-inventory',
    {
      token,
      body: input,
      idempotencyKey: `orders-validate-${Date.now()}`,
    },
  );
}

export async function allocateOrderInventory(token: string, input: AllocateInventoryRequest): Promise<void> {
  await apiClient.post<operations['OrderWriteController_allocateInventory_v1']['responses'][201], AllocateInventoryRequest>(
    '/orders/commands/allocate-inventory',
    {
      token,
      body: input,
      idempotencyKey: `orders-allocate-${Date.now()}`,
    },
  );
}

export async function listStockVouchers(token: string): Promise<StockVoucher[]> {
  const { data } = await apiClient.get<StockVouchersResponse>('/inventory/stock-adjustment/vouchers', {
    token,
  });
  return parseList(data, parseStockVoucher);
}

export async function createStockVoucher(
  token: string,
  input: CreateStockVoucherRequest,
): Promise<StockVoucher> {
  const { data } = await apiClient.post<CreateStockVoucherResponse, CreateStockVoucherRequest>(
    '/inventory/stock-adjustment/vouchers',
    {
      token,
      body: input,
      idempotencyKey: `stock-voucher-create-${Date.now()}`,
    },
  );

  return parseFirst(data, parseStockVoucher, 'Stock voucher create returned an empty payload.');
}

export async function updateStockVoucher(
  token: string,
  voucherId: string,
  input: UpdateStockVoucherRequest,
): Promise<StockVoucher> {
  const { data } = await apiClient.patch<UpdateStockVoucherResponse, UpdateStockVoucherRequest>(
    `/inventory/stock-adjustment/vouchers/${voucherId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseStockVoucher, 'Stock voucher update returned an empty payload.');
}

export async function updateStockVoucherStatus(
  token: string,
  voucherId: string,
  input: UpdateStockVoucherStatusRequest,
): Promise<StockVoucher> {
  const { data } = await apiClient.patch<UpdateStockVoucherStatusResponse, UpdateStockVoucherStatusRequest>(
    `/inventory/stock-adjustment/vouchers/${voucherId}/status`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseStockVoucher, 'Stock voucher status update returned an empty payload.');
}

export async function deleteStockVoucher(token: string, voucherId: string): Promise<boolean> {
  const { data } = await apiClient.delete<DeleteStockVoucherResponse>(
    `/inventory/stock-adjustment/vouchers/${voucherId}`,
    {
      token,
    },
  );

  return isRecord(data) ? readBoolean(data, 'deleted') : false;
}

export async function insertStockVoucherLineItems(
  token: string,
  voucherId: string,
  input: InsertVoucherLineItemsRequest,
): Promise<StockVoucherLineItem[]> {
  const { data } = await apiClient.post<InsertVoucherLineItemsResponse, InsertVoucherLineItemsRequest>(
    `/inventory/stock-adjustment/vouchers/${voucherId}/line-items`,
    {
      token,
      body: input,
      idempotencyKey: `stock-voucher-lines-create-${voucherId}-${Date.now()}`,
    },
  );

  return parseList(data, parseVoucherLineItem);
}

export async function deleteStockVoucherLineItems(token: string, voucherId: string): Promise<boolean> {
  const { data } = await apiClient.delete<DeleteVoucherLineItemsResponse>(
    `/inventory/stock-adjustment/vouchers/${voucherId}/line-items`,
    {
      token,
    },
  );

  return isRecord(data) ? readBoolean(data, 'deleted') : false;
}

export async function listStockAdjustmentProducts(token: string): Promise<StockAdjustmentProductOption[]> {
  const { data } = await apiClient.get<StockAdjustmentProductsResponse>(
    '/inventory/stock-adjustment/products',
    {
      token,
    },
  );

  return parseList(data, parseStockProductOption);
}

export async function listStockAdjustmentContacts(token: string): Promise<StockAdjustmentContactOption[]> {
  const { data } = await apiClient.get<StockAdjustmentContactsResponse>(
    '/inventory/stock-adjustment/contacts',
    {
      token,
    },
  );

  return parseList(data, parseStockContactOption);
}

export async function listStockAdjustmentWarehouses(
  token: string,
): Promise<StockAdjustmentWarehouseOption[]> {
  const { data } = await apiClient.get<StockAdjustmentWarehousesResponse>(
    '/inventory/stock-adjustment/warehouses',
    {
      token,
    },
  );

  return parseList(data, parseStockWarehouseOption);
}

export async function listProductInventory(token: string): Promise<ProductInventoryRecord[]> {
  const { data } = await apiClient.get<ProductInventoryResponse>(
    '/inventory/stock-adjustment/product-inventory',
    {
      token,
    },
  );

  return parseList(data, parseInventoryRecord);
}

export async function createInventoryRecord(
  token: string,
  input: CreateInventoryRecordRequest,
): Promise<ProductInventoryRecord> {
  const { data } = await apiClient.post<CreateInventoryRecordResponse, CreateInventoryRecordRequest>(
    '/inventory/stock-adjustment/product-inventory',
    {
      token,
      body: input,
      idempotencyKey: `stock-inventory-create-${Date.now()}`,
    },
  );

  return parseFirst(data, parseInventoryRecord, 'Inventory record create returned an empty payload.');
}

export async function listProductInventoryRows(
  token: string,
  input: ProductInventoryRowsLookupRequest,
): Promise<InventoryRowSummary[]> {
  const { data } = await apiClient.post<ProductInventoryRowsResponse, ProductInventoryRowsLookupRequest>(
    '/inventory/stock-adjustment/product-inventory/rows',
    {
      token,
      body: input,
      idempotencyKey: `stock-inventory-rows-${Date.now()}`,
    },
  );

  return parseList(data, parseInventoryRowSummary);
}

export async function listInventoryQuantities(
  token: string,
  input: InventoryQuantitiesLookupRequest,
): Promise<InventoryQuantitySummary[]> {
  const { data } = await apiClient.post<InventoryQuantitiesResponse, InventoryQuantitiesLookupRequest>(
    '/inventory/stock-adjustment/product-inventory/quantities',
    {
      token,
      body: input,
      idempotencyKey: `stock-inventory-quantities-${Date.now()}`,
    },
  );

  return parseList(data, parseInventoryQuantitySummary);
}

export async function findInventoryEntry(
  token: string,
  input: FindInventoryEntryRequest,
): Promise<ProductInventoryRecord | null> {
  const { data } = await apiClient.post<FindInventoryEntryResponse, FindInventoryEntryRequest>(
    '/inventory/stock-adjustment/product-inventory/find-entry',
    {
      token,
      body: input,
      idempotencyKey: `stock-inventory-find-${Date.now()}`,
    },
  );

  return parseInventoryRecord(data);
}

export async function getInventoryBatchById(
  token: string,
  inventoryId: string,
): Promise<ProductInventoryRecord | null> {
  const { data } = await apiClient.get<InventoryBatchByIdResponse>(
    `/inventory/stock-adjustment/product-inventory/${inventoryId}`,
    {
      token,
    },
  );

  return parseInventoryRecord(data);
}

export async function updateInventoryRecord(
  token: string,
  inventoryId: string,
  input: UpdateInventoryRecordRequest,
): Promise<ProductInventoryRecord> {
  const { data } = await apiClient.patch<UpdateInventoryRecordResponse, UpdateInventoryRecordRequest>(
    `/inventory/stock-adjustment/product-inventory/${inventoryId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseInventoryRecord, 'Inventory record update returned an empty payload.');
}

export async function updateInventoryQuantity(
  token: string,
  inventoryId: string,
  input: UpdateInventoryQuantityRequest,
): Promise<ProductInventoryRecord> {
  const { data } = await apiClient.patch<UpdateInventoryQuantityResponse, UpdateInventoryQuantityRequest>(
    `/inventory/stock-adjustment/product-inventory/${inventoryId}/quantity`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseInventoryRecord, 'Inventory quantity update returned an empty payload.');
}

export async function deleteInventoryRecord(token: string, inventoryId: string): Promise<boolean> {
  const { data } = await apiClient.delete<DeleteInventoryRecordResponse>(
    `/inventory/stock-adjustment/product-inventory/${inventoryId}`,
    {
      token,
    },
  );

  return isRecord(data) ? readBoolean(data, 'deleted') : false;
}

export async function listSalesTransactions(token: string): Promise<SalesTransaction[]> {
  const { data } = await apiClient.get<SalesTransactionsResponse>('/sales-transactions', {
    token,
  });

  return parseList(data, parseSalesTransaction);
}

export async function createSalesTransaction(
  token: string,
  input: CreateSalesTransactionRequest,
): Promise<SalesTransaction> {
  const { data } = await apiClient.post<CreateSalesTransactionResponse, CreateSalesTransactionRequest>(
    '/sales-transactions',
    {
      token,
      body: input,
      idempotencyKey: `sales-transaction-create-${Date.now()}`,
    },
  );

  return parseFirst(data, parseSalesTransaction, 'Sales transaction create returned an empty payload.');
}

export async function getSalesTransactionById(
  token: string,
  transactionId: string,
): Promise<SalesTransaction | null> {
  const { data } = await apiClient.get<GetSalesTransactionResponse>(
    `/sales-transactions/${transactionId}`,
    {
      token,
    },
  );

  return parseSalesTransaction(data);
}

export async function updateSalesTransaction(
  token: string,
  transactionId: string,
  input: UpdateSalesTransactionRequest,
): Promise<SalesTransaction> {
  const { data } = await apiClient.patch<UpdateSalesTransactionResponse, UpdateSalesTransactionRequest>(
    `/sales-transactions/${transactionId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseSalesTransaction, 'Sales transaction update returned an empty payload.');
}

export async function completeSalesTransaction(
  token: string,
  transactionId: string,
): Promise<SalesTransaction | null> {
  const { data } = await apiClient.post<CompleteSalesTransactionResponse>(
    `/sales-transactions/${transactionId}/commands/complete`,
    {
      token,
      idempotencyKey: `sales-transaction-complete-${transactionId}-${Date.now()}`,
    },
  );

  return parseSalesTransaction(data);
}

export async function listSalesTransactionLines(
  token: string,
  transactionId: string,
): Promise<SalesTransactionLine[]> {
  const { data } = await apiClient.get<SalesTransactionLinesResponse>(
    `/sales-transactions/${transactionId}/lines`,
    {
      token,
    },
  );

  return parseList(data, parseSalesTransactionLine);
}

export async function createSalesTransactionLine(
  token: string,
  transactionId: string,
  input: CreateSalesTransactionLineRequest,
): Promise<SalesTransactionLine> {
  const { data } = await apiClient.post<CreateSalesTransactionLineResponse, CreateSalesTransactionLineRequest>(
    `/sales-transactions/${transactionId}/lines`,
    {
      token,
      body: input,
      idempotencyKey: `sales-transaction-line-create-${transactionId}-${Date.now()}`,
    },
  );

  return parseFirst(data, parseSalesTransactionLine, 'Sales transaction line create returned empty payload.');
}

export async function updateSalesTransactionLine(
  token: string,
  lineId: string,
  input: UpdateSalesTransactionLineRequest,
): Promise<SalesTransactionLine> {
  const { data } = await apiClient.patch<UpdateSalesTransactionLineResponse, UpdateSalesTransactionLineRequest>(
    `/sales-transactions/lines/${lineId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseSalesTransactionLine, 'Sales transaction line update returned empty payload.');
}

export async function deleteSalesTransactionLine(token: string, lineId: string): Promise<boolean> {
  const { data } = await apiClient.delete<DeleteSalesTransactionLineResponse>(
    `/sales-transactions/lines/${lineId}`,
    {
      token,
    },
  );

  return isRecord(data) ? readBoolean(data, 'deleted') : false;
}
