import {
  createOrder,
  createSalesTransaction,
  insertStockVoucherLineItems,
  listUnreadOrders,
  updateOrder,
} from '../../../api/modules/orders';

const originalFetch = global.fetch;

describe('orders api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('lists unread orders and parses response rows', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 'order-1',
            order_number: 'ORD-001',
            status: 'pending',
            customer_name: 'Ahmad',
            total_amount: 100,
            subtotal: 90,
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
            order_items_count: 2,
          },
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const rows = await listUnreadOrders('token');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'order-1',
      orderNumber: 'ORD-001',
      status: 'pending',
      customerName: 'Ahmad',
      itemsCount: 2,
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:3300/api/v1/orders/unread');
    expect(options.method).toBe('GET');
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer token');
  });

  it('sends create and update order requests using generated payload shape', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'order-1',
            order_number: 'ORD-001',
            status: 'pending',
            customer_name: 'Ahmad',
            total_amount: 42,
            subtotal: 42,
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
            order_items_count: 1,
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'order-1',
            order_number: 'ORD-001',
            status: 'processing',
            customer_name: 'Ahmad',
            total_amount: 42,
            subtotal: 42,
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
            order_items_count: 1,
          }),
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createOrder('token', {
      status: 'pending',
      order_items: [
        {
          product_id: 'product-1',
          product_name: 'Seeds',
          quantity: 2,
          unit_price: 21,
        },
      ],
      notes: 'Phase 10 test order',
    });

    await updateOrder('token', 'order-1', {
      status: 'processing',
      notes: 'Updated in test',
    });

    const [createUrl, createOptions] = fetchMock.mock.calls[0];
    expect(createUrl).toBe('http://127.0.0.1:3300/api/v1/orders/commands/create');
    expect(createOptions.method).toBe('POST');
    expect((createOptions.headers as Record<string, string>)['x-phase6-failure-mode']).toBe('none');
    expect((createOptions.headers as Record<string, string>)['Idempotency-Key']).toEqual(
      expect.stringMatching(/^orders-create-/),
    );
    expect(JSON.parse(createOptions.body as string)).toMatchObject({
      status: 'pending',
      order_items: [
        {
          product_id: 'product-1',
          product_name: 'Seeds',
          quantity: 2,
          unit_price: 21,
        },
      ],
      notes: 'Phase 10 test order',
    });

    const [updateUrl, updateOptions] = fetchMock.mock.calls[1];
    expect(updateUrl).toBe('http://127.0.0.1:3300/api/v1/orders/order-1');
    expect(updateOptions.method).toBe('PATCH');
    expect(JSON.parse(updateOptions.body as string)).toEqual({
      status: 'processing',
      notes: 'Updated in test',
    });
  });

  it('sends stock line and sales transaction payloads and parses response wrappers', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify([
            {
              id: 'line-1',
              voucher_id: 'voucher-1',
              product_id: 'product-1',
              warehouse_id: 'warehouse-1',
              quantity: 2,
            },
          ]),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            transaction: {
              id: 'tx-1',
              status: 'pending',
              transaction_date: '2026-03-02',
              price_type: 'sale_price',
              subtotal: 10,
              tax_amount: 1,
              total_amount: 11,
              created_at: '2026-03-02T00:00:00.000Z',
              updated_at: '2026-03-02T00:00:00.000Z',
            },
            order: null,
          }),
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const lineItems = await insertStockVoucherLineItems('token', 'voucher-1', {
      items: [
        {
          product_id: 'product-1',
          warehouse_id: 'warehouse-1',
          quantity: 2,
        },
      ],
    });

    const transaction = await createSalesTransaction('token', {
      status: 'pending',
      transaction_date: '2026-03-02',
      price_type: 'sale_price',
      notes: 'Created from test',
    });

    expect(lineItems).toHaveLength(1);
    expect(lineItems[0]).toMatchObject({
      id: 'line-1',
      voucherId: 'voucher-1',
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 2,
    });
    expect(transaction).toMatchObject({
      id: 'tx-1',
      status: 'pending',
      priceType: 'sale_price',
      totalAmount: 11,
    });

    const [lineItemsUrl, lineItemsOptions] = fetchMock.mock.calls[0];
    expect(lineItemsUrl).toBe(
      'http://127.0.0.1:3300/api/v1/inventory/stock-adjustment/vouchers/voucher-1/line-items',
    );
    expect(lineItemsOptions.method).toBe('POST');

    const [salesUrl, salesOptions] = fetchMock.mock.calls[1];
    expect(salesUrl).toBe('http://127.0.0.1:3300/api/v1/sales-transactions');
    expect(salesOptions.method).toBe('POST');
    expect(JSON.parse(salesOptions.body as string)).toMatchObject({
      status: 'pending',
      transaction_date: '2026-03-02',
      price_type: 'sale_price',
    });
  });
});
