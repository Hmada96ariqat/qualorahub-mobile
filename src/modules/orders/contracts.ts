import type {
  CreateOrderRequest,
  CreateSalesTransactionRequest,
  CreateStockVoucherRequest,
  OrderSummary,
  SalesTransaction,
  StockVoucher,
  UpdateOrderStatusRequest,
  UpdateStockVoucherStatusRequest,
} from '../../api/modules/orders';

export type Phase10Tab = 'orders' | 'stock' | 'sales';

export type CreateOrderStatus = NonNullable<CreateOrderRequest['status']>;
export type UpdatableOrderStatus = UpdateOrderStatusRequest['status'];
export type StockVoucherTypeInput = CreateStockVoucherRequest['type'];
export type StockVoucherStatusInput = NonNullable<UpdateStockVoucherStatusRequest['status']>;
export type SalesStatusInput = NonNullable<CreateSalesTransactionRequest['status']>;
export type SalesPriceTypeInput = NonNullable<CreateSalesTransactionRequest['price_type']>;

export const PHASE10_TAB_OPTIONS = [
  { value: 'orders', label: 'Orders' },
  { value: 'stock', label: 'Stock' },
  { value: 'sales', label: 'Sales' },
] as const;

export const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const STOCK_VOUCHER_TYPE_OPTIONS = [
  { value: 'entry', label: 'Entry' },
  { value: 'out', label: 'Out' },
] as const;

export const STOCK_VOUCHER_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'posted', label: 'Posted' },
  { value: 'completed', label: 'Completed' },
] as const;

export const SALES_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const SALES_PRICE_TYPE_OPTIONS = [
  { value: 'sale_price', label: 'Sale price' },
  { value: 'wholesale_price', label: 'Wholesale price' },
] as const;

export type OrderFormValues = {
  status: string;
  contactId: string;
  orderDate: string;
  deliveryDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPostalCode: string;
  shippingAddress: string;
  paymentMethod: string;
  deliveryMethod: string;
  notes: string;
  productId: string;
  quantity: string;
  unitPrice: string;
};

export type OrderStatusFormValues = {
  status: string;
};

export type StockVoucherFormValues = {
  type: string;
  status: string;
  contactId: string;
  voucherDate: string;
  voucherReference: string;
  sourceType: string;
  notes: string;
};

export type StockVoucherLineItemFormValues = {
  productId: string;
  warehouseId: string;
  quantity: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
};

export type SalesTransactionFormValues = {
  status: string;
  transactionDate: string;
  priceType: string;
  contactId: string;
  notes: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  affectsIncome: string;
};

export type SalesTransactionLineFormValues = {
  productId: string;
  productName: string;
  warehouseId: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
};

function toDateOnly(value: string | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.includes('T') ? value.slice(0, 10) : value;
}

function toMoneyString(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return value.toFixed(2);
}

export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeCreateOrderStatus(value: string | null | undefined): CreateOrderStatus {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized === 'confirmed' ? 'confirmed' : 'pending';
}

export function normalizeOrderStatus(value: string | null | undefined): UpdatableOrderStatus {
  const normalized = (value ?? '').trim().toLowerCase();
  if (
    normalized === 'pending' ||
    normalized === 'confirmed' ||
    normalized === 'processing' ||
    normalized === 'shipped' ||
    normalized === 'delivered' ||
    normalized === 'cancelled'
  ) {
    return normalized as UpdatableOrderStatus;
  }
  return 'pending';
}

export function normalizeStockVoucherType(value: string | null | undefined): StockVoucherTypeInput {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized === 'out' ? 'out' : 'entry';
}

export function normalizeStockVoucherStatus(value: string | null | undefined): StockVoucherStatusInput {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'posted' || normalized === 'completed') return normalized;
  return 'draft';
}

export function normalizeSalesStatus(value: string | null | undefined): SalesStatusInput {
  return normalizeOrderStatus(value) as SalesStatusInput;
}

export function normalizeSalesPriceType(value: string | null | undefined): SalesPriceTypeInput {
  return value === 'wholesale_price' ? 'wholesale_price' : 'sale_price';
}

export function toOrderFormValues(order?: OrderSummary | null): OrderFormValues {
  if (!order) {
    return {
      status: 'pending',
      contactId: '',
      orderDate: new Date().toISOString().slice(0, 10),
      deliveryDate: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      customerCity: '',
      customerPostalCode: '',
      shippingAddress: '',
      paymentMethod: '',
      deliveryMethod: '',
      notes: '',
      productId: '',
      quantity: '1',
      unitPrice: '1',
    };
  }

  return {
    status: normalizeOrderStatus(order.status),
    contactId: order.contactId ?? '',
    orderDate: toDateOnly(order.orderDate),
    deliveryDate: toDateOnly(order.deliveryDate),
    customerName: order.customerName ?? '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    customerPostalCode: '',
    shippingAddress: '',
    paymentMethod: order.paymentMethod ?? '',
    deliveryMethod: '',
    notes: order.notes ?? '',
    productId: '',
    quantity: '1',
    unitPrice: '1',
  };
}

export function toOrderStatusFormValues(order?: OrderSummary | null): OrderStatusFormValues {
  return {
    status: normalizeOrderStatus(order?.status),
  };
}

export function toStockVoucherFormValues(voucher?: StockVoucher | null): StockVoucherFormValues {
  if (!voucher) {
    return {
      type: 'entry',
      status: 'draft',
      contactId: '',
      voucherDate: new Date().toISOString().slice(0, 10),
      voucherReference: '',
      sourceType: '',
      notes: '',
    };
  }

  return {
    type: normalizeStockVoucherType(voucher.type),
    status: normalizeStockVoucherStatus(voucher.status),
    contactId: voucher.contactId ?? '',
    voucherDate: toDateOnly(voucher.voucherDate),
    voucherReference: voucher.voucherReference ?? '',
    sourceType: voucher.sourceType ?? '',
    notes: voucher.notes ?? '',
  };
}

export function toStockVoucherLineItemFormValues(): StockVoucherLineItemFormValues {
  return {
    productId: '',
    warehouseId: '',
    quantity: '1',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
  };
}

export function toSalesTransactionFormValues(
  transaction?: SalesTransaction | null,
): SalesTransactionFormValues {
  if (!transaction) {
    return {
      status: 'pending',
      transactionDate: new Date().toISOString().slice(0, 10),
      priceType: 'sale_price',
      contactId: '',
      notes: '',
      subtotal: '',
      taxAmount: '',
      totalAmount: '',
      affectsIncome: 'yes',
    };
  }

  return {
    status: normalizeSalesStatus(transaction.status),
    transactionDate: toDateOnly(transaction.transactionDate),
    priceType: transaction.priceType ?? 'sale_price',
    contactId: transaction.contactId ?? '',
    notes: transaction.notes ?? '',
    subtotal: toMoneyString(transaction.subtotal),
    taxAmount: toMoneyString(transaction.taxAmount),
    totalAmount: toMoneyString(transaction.totalAmount),
    affectsIncome: 'yes',
  };
}

export function toSalesTransactionLineFormValues(): SalesTransactionLineFormValues {
  return {
    productId: '',
    productName: '',
    warehouseId: '',
    quantity: '1',
    unitPrice: '1',
    subtotal: '1',
  };
}
