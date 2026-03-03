import {
  normalizeCreateOrderStatus,
  normalizeOrderStatus,
  normalizeSalesPriceType,
  normalizeSalesStatus,
  normalizeStockVoucherStatus,
  normalizeStockVoucherType,
  parseOptionalNumber,
  toOrderFormValues,
  toSalesTransactionFormValues,
  toStockVoucherFormValues,
} from '../contracts';

describe('orders contracts helpers', () => {
  it('normalizes command statuses to generated unions', () => {
    expect(normalizeCreateOrderStatus('confirmed')).toBe('confirmed');
    expect(normalizeCreateOrderStatus('processing')).toBe('pending');
    expect(normalizeOrderStatus('processing')).toBe('processing');
    expect(normalizeOrderStatus('invalid')).toBe('pending');
    expect(normalizeStockVoucherType('out')).toBe('out');
    expect(normalizeStockVoucherType('invalid')).toBe('entry');
    expect(normalizeStockVoucherStatus('completed')).toBe('completed');
    expect(normalizeStockVoucherStatus('invalid')).toBe('draft');
    expect(normalizeSalesStatus('cancelled')).toBe('cancelled');
    expect(normalizeSalesPriceType('wholesale_price')).toBe('wholesale_price');
    expect(normalizeSalesPriceType('unknown')).toBe('sale_price');
  });

  it('maps rows to editable form values', () => {
    expect(
      toOrderFormValues({
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'confirmed',
        customerName: 'Ahmad',
        totalAmount: 120,
        subtotal: 100,
        orderDate: '2026-03-02',
        deliveryDate: '2026-03-03',
        paymentMethod: 'cash',
        notes: 'Deliver early',
        contactId: 'contact-1',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
        readAt: null,
        itemsCount: 1,
      }),
    ).toMatchObject({
      status: 'confirmed',
      customerName: 'Ahmad',
      contactId: 'contact-1',
      paymentMethod: 'cash',
      notes: 'Deliver early',
    });

    expect(
      toStockVoucherFormValues({
        id: 'voucher-1',
        type: 'out',
        status: 'posted',
        contactId: 'contact-1',
        voucherDate: '2026-03-02',
        voucherReference: 'SV-1',
        notes: null,
        sourceType: null,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
        lineItemsCount: 0,
      }),
    ).toMatchObject({
      type: 'out',
      status: 'posted',
      contactId: 'contact-1',
      voucherReference: 'SV-1',
    });

    expect(
      toSalesTransactionFormValues({
        id: 'sales-1',
        status: 'confirmed',
        transactionDate: '2026-03-02',
        priceType: 'sale_price',
        contactId: 'contact-1',
        notes: 'From app',
        subtotal: 10,
        taxAmount: 1.5,
        totalAmount: 11.5,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      }),
    ).toMatchObject({
      status: 'confirmed',
      priceType: 'sale_price',
      subtotal: '10.00',
      taxAmount: '1.50',
      totalAmount: '11.50',
    });
  });

  it('parses optional numbers safely', () => {
    expect(parseOptionalNumber('')).toBeUndefined();
    expect(parseOptionalNumber('abc')).toBeUndefined();
    expect(parseOptionalNumber('12.5')).toBe(12.5);
  });
});
