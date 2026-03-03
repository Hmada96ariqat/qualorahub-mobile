import {
  createCategory,
  createInventoryContact,
  createProduct,
  createWarehouse,
  enableStorefrontForActiveCategories,
  hardDeleteProducts,
  listCropsForGuidance,
  listManufacturerContacts,
  listCategories,
  listProducts,
  listStockAdjustmentProducts,
  listSupplierContacts,
  listWarehouses,
  updateCategory,
  updateProduct,
  updateWarehouse,
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

  it('parses warehouse list fields and sends typed create/update payload', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                field_id: 'field-1',
                status: 'active',
                capacity_value: 1000,
                capacity_unit: 'kg',
                warehouse_types: ['cold_storage', 'packing_house'],
                temperature_min: 2,
                temperature_max: 8,
                safety_measures: 'PPE required',
                notes: 'Primary',
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
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'warehouse-2',
            name: 'Secondary Warehouse',
            field_id: 'field-2',
            status: 'active',
            capacity_value: 500,
            capacity_unit: 'kg',
            warehouse_types: ['seed_storage'],
            temperature_min: null,
            temperature_max: null,
            safety_measures: null,
            notes: null,
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
            id: 'warehouse-2',
            name: 'Secondary Warehouse Updated',
            field_id: 'field-2',
            status: 'inactive',
            capacity_value: 550,
            capacity_unit: 'kg',
            warehouse_types: ['seed_storage', 'other'],
            temperature_min: 4,
            temperature_max: 10,
            safety_measures: 'Mask required',
            notes: 'Updated',
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const warehouses = await listWarehouses('token', { limit: 20, offset: 0, status: 'all' });
    expect(warehouses.items[0]).toMatchObject({
      id: 'warehouse-1',
      name: 'Main Warehouse',
      warehouseTypes: ['cold_storage', 'packing_house'],
      temperatureMin: 2,
      temperatureMax: 8,
      safetyMeasures: 'PPE required',
    });

    await createWarehouse('token', {
      name: 'Secondary Warehouse',
      field_id: 'field-2',
      status: 'active',
      capacity_value: 500,
      capacity_unit: 'kg',
      warehouse_types: ['seed_storage'],
      notes: null,
    });
    await updateWarehouse('token', 'warehouse-2', {
      name: 'Secondary Warehouse Updated',
      status: 'inactive',
      warehouse_types: ['seed_storage', 'other'],
      temperature_min: 4,
      temperature_max: 10,
      safety_measures: 'Mask required',
      notes: 'Updated',
    });

    const [listUrl] = fetchMock.mock.calls[0];
    expect(listUrl).toBe('http://127.0.0.1:3300/api/v1/warehouses?limit=20&offset=0');

    const [createUrl, createOptions] = fetchMock.mock.calls[1];
    expect(createUrl).toBe('http://127.0.0.1:3300/api/v1/warehouses');
    expect(createOptions.method).toBe('POST');
    expect(JSON.parse(createOptions.body as string)).toMatchObject({
      name: 'Secondary Warehouse',
      field_id: 'field-2',
      capacity_value: 500,
      warehouse_types: ['seed_storage'],
    });

    const [updateUrl, updateOptions] = fetchMock.mock.calls[2];
    expect(updateUrl).toBe('http://127.0.0.1:3300/api/v1/warehouses/warehouse-2');
    expect(updateOptions.method).toBe('PATCH');
    expect(JSON.parse(updateOptions.body as string)).toMatchObject({
      name: 'Secondary Warehouse Updated',
      warehouse_types: ['seed_storage', 'other'],
      safety_measures: 'Mask required',
    });
  });

  it('calls category bulk storefront endpoint and returns updated count', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ updated: 7 }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const updated = await enableStorefrontForActiveCategories('token');
    expect(updated).toBe(7);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:3300/api/v1/categories/bulk/enable-storefront');
    expect(options.method).toBe('PATCH');
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer token');
  });

  it('creates supplier/manufacturer contacts through inventory API wrapper', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 201,
        text: async () => '',
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createInventoryContact('token', {
      name: 'Supplier One',
      type: 'supplier',
      contact_types: ['supplier'],
      company: 'Qualora',
      email: 'supplier@example.com',
      notes: 'Preferred',
    });

    await createInventoryContact('token', {
      name: 'Manufacturer One',
      type: 'manufacturer',
      contact_types: ['manufacturer'],
      status: 'active',
    });

    const [supplierUrl, supplierOptions] = fetchMock.mock.calls[0];
    expect(supplierUrl).toBe('http://127.0.0.1:3300/api/v1/contacts');
    expect(supplierOptions.method).toBe('POST');
    expect((supplierOptions.headers as Record<string, string>)['Idempotency-Key']).toEqual(
      expect.stringMatching(/^contacts-create-/),
    );
    expect(JSON.parse(supplierOptions.body as string)).toMatchObject({
      name: 'Supplier One',
      type: 'supplier',
      contact_types: ['supplier'],
      company: 'Qualora',
      email: 'supplier@example.com',
      notes: 'Preferred',
      status: 'active',
    });

    const [manufacturerUrl, manufacturerOptions] = fetchMock.mock.calls[1];
    expect(manufacturerUrl).toBe('http://127.0.0.1:3300/api/v1/contacts');
    expect(manufacturerOptions.method).toBe('POST');
    expect(JSON.parse(manufacturerOptions.body as string)).toMatchObject({
      name: 'Manufacturer One',
      type: 'manufacturer',
      contact_types: ['manufacturer'],
      status: 'active',
    });
  });

  it('parses supplier/manufacturer contact options and crop guidance options', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: 'contact-1',
                name: 'Supplier A',
                contact_types: ['supplier'],
              },
            ],
            total: 1,
            limit: 50,
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
              id: 'contact-2',
              name: 'Manufacturer A',
              contact_types: ['manufacturer'],
            },
          ]),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            { id: 'crop-1', name: 'Tomato' },
            { id: 'crop-2', crop_name: 'Cucumber' },
          ]),
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const suppliers = await listSupplierContacts('token');
    const manufacturers = await listManufacturerContacts('token');
    const crops = await listCropsForGuidance('token');

    expect(suppliers).toEqual([{ id: 'contact-1', name: 'Supplier A', contactTypes: ['supplier'] }]);
    expect(manufacturers).toEqual([
      { id: 'contact-2', name: 'Manufacturer A', contactTypes: ['manufacturer'] },
    ]);
    expect(crops).toEqual([
      { id: 'crop-1', name: 'Tomato' },
      { id: 'crop-2', name: 'Cucumber' },
    ]);

    const [suppliersUrl] = fetchMock.mock.calls[0];
    expect(suppliersUrl).toBe(
      'http://127.0.0.1:3300/api/v1/contacts?limit=200&offset=0&status=active&contactTypes=supplier',
    );
    const [manufacturersUrl] = fetchMock.mock.calls[1];
    expect(manufacturersUrl).toBe(
      'http://127.0.0.1:3300/api/v1/contacts?limit=200&offset=0&status=active&contactTypes=manufacturer',
    );
    const [cropsUrl] = fetchMock.mock.calls[2];
    expect(cropsUrl).toBe('http://127.0.0.1:3300/api/v1/crops/guidance');
  });
});
