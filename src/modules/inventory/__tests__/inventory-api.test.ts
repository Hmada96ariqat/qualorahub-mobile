import {
  createCategory,
  createProduct,
  hardDeleteProducts,
  listCategories,
  listProducts,
  listStockAdjustmentProducts,
  updateCategory,
  updateProduct,
} from '../../../api/modules/inventory';

const originalFetch = global.fetch;

describe('inventory api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses categories paginated payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'category-1',
              name: 'Seeds',
              parent_id: null,
              image_url: null,
              display_on_storefront: true,
              notes: 'Core category',
              status: 'active',
              created_at: '2026-03-02T00:00:00.000Z',
              updated_at: '2026-03-02T00:00:00.000Z',
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await listCategories('token', { limit: 50, offset: 0, status: 'active' });

    expect(response.total).toBe(1);
    expect(response.items[0]).toMatchObject({
      id: 'category-1',
      name: 'Seeds',
      status: 'active',
      displayOnStorefront: true,
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:3300/api/v1/categories?limit=50&offset=0&status=active');
    expect(options.method).toBe('GET');
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer token');
  });

  it('builds create/update payloads and hard-delete command', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'category-2',
            name: 'Fertilizers',
            status: 'active',
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'category-2',
            name: 'Fertilizers Updated',
            status: 'inactive',
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'product-1',
            name: 'Tomato Seeds',
            unit: 'kg',
            sku: 'SKU-1',
            status: 'active',
            has_expiry: false,
            display_on_storefront: false,
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'product-1',
            name: 'Tomato Seeds Updated',
            unit: 'kg',
            sku: 'SKU-1',
            status: 'inactive',
            has_expiry: false,
            display_on_storefront: false,
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ deletedCount: 1 }),
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createCategory('token', { name: 'Fertilizers' });
    await updateCategory('token', 'category-2', { name: 'Fertilizers Updated', status: 'inactive' });
    await createProduct('token', { name: 'Tomato Seeds', unit: 'kg', sku: 'SKU-1', status: 'active' });
    await updateProduct('token', 'product-1', { name: 'Tomato Seeds Updated', status: 'inactive' });
    const deletedCount = await hardDeleteProducts('token', { ids: ['product-1'] });

    expect(deletedCount).toBe(1);

    const [createCategoryUrl, createCategoryOptions] = fetchMock.mock.calls[0];
    expect(createCategoryUrl).toBe('http://127.0.0.1:3300/api/v1/categories');
    expect(createCategoryOptions.method).toBe('POST');
    expect((createCategoryOptions.headers as Record<string, string>)['Idempotency-Key']).toEqual(
      expect.stringMatching(/^categories-create-/),
    );
    expect(JSON.parse(createCategoryOptions.body as string)).toEqual({ name: 'Fertilizers' });

    const [updateCategoryUrl, updateCategoryOptions] = fetchMock.mock.calls[1];
    expect(updateCategoryUrl).toBe('http://127.0.0.1:3300/api/v1/categories/category-2');
    expect(updateCategoryOptions.method).toBe('PATCH');
    expect(JSON.parse(updateCategoryOptions.body as string)).toEqual({
      name: 'Fertilizers Updated',
      status: 'inactive',
    });

    const [createProductUrl, createProductOptions] = fetchMock.mock.calls[2];
    expect(createProductUrl).toBe('http://127.0.0.1:3300/api/v1/products');
    expect(createProductOptions.method).toBe('POST');
    expect((createProductOptions.headers as Record<string, string>)['Idempotency-Key']).toEqual(
      expect.stringMatching(/^products-create-/),
    );

    const [updateProductUrl, updateProductOptions] = fetchMock.mock.calls[3];
    expect(updateProductUrl).toBe('http://127.0.0.1:3300/api/v1/products/product-1');
    expect(updateProductOptions.method).toBe('PATCH');

    const [hardDeleteUrl, hardDeleteOptions] = fetchMock.mock.calls[4];
    expect(hardDeleteUrl).toBe('http://127.0.0.1:3300/api/v1/products/commands/hard-delete');
    expect(hardDeleteOptions.method).toBe('POST');
    expect(JSON.parse(hardDeleteOptions.body as string)).toEqual({ ids: ['product-1'] });
  });

  it('loads canonical products list and stock-adjustment products', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: 'product-1',
                name: 'Alpha',
                status: 'active',
                sku: 'SKU-1',
                unit: 'kg',
                has_expiry: false,
                display_on_storefront: true,
                threshold: 3,
                price_per_unit: 20,
                created_at: '2026-03-02T00:00:00.000Z',
                updated_at: '2026-03-02T00:00:00.000Z',
              },
            ],
            total: 1,
            limit: 20,
            offset: 0,
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              id: 'product-1',
              name: 'Alpha',
              sku: 'SKU-1',
              unit: 'kg',
              status: 'active',
            },
          ]),
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const products = await listProducts('token', { limit: 20, offset: 0, status: 'active' });
    const stockAdjustmentProducts = await listStockAdjustmentProducts('token');

    expect(products.items.length).toBe(1);
    expect(stockAdjustmentProducts.length).toBe(1);

    const [productsUrl] = fetchMock.mock.calls[0];
    expect(productsUrl).toBe('http://127.0.0.1:3300/api/v1/products?limit=20&offset=0&status=active');

    const [stockAdjustmentUrl] = fetchMock.mock.calls[1];
    expect(stockAdjustmentUrl).toBe('http://127.0.0.1:3300/api/v1/inventory/stock-adjustment/products');
  });
});
