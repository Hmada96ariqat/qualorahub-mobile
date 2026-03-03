import {
  parseOptionalNumber,
  toCategoryFormValues,
  toProductFormValues,
  toTaxFormValues,
  toWarehouseFormValues,
} from '../contracts';

describe('inventory contracts helpers', () => {
  it('builds category form defaults', () => {
    expect(toCategoryFormValues()).toEqual({
      name: '',
      parentId: '',
      imageUrl: '',
      displayOnStorefront: false,
      notes: '',
      status: 'active',
    });
  });

  it('maps product row to form values', () => {
    expect(
      toProductFormValues({
        id: 'product-1',
        name: 'Tomato Seeds',
        description: null,
        categoryId: 'category-1',
        taxId: null,
        productType: null,
        source: null,
        unit: 'kg',
        sku: 'SKU-01',
        barcode: null,
        status: 'inactive',
        hasExpiry: false,
        displayOnStorefront: true,
        threshold: 5,
        pricePerUnit: 10.5,
        purchasePrice: 8.4,
        wholesalePrice: 9.9,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      }),
    ).toEqual({
      name: 'Tomato Seeds',
      description: '',
      categoryId: 'category-1',
      taxId: '',
      unit: 'kg',
      sku: 'SKU-01',
      status: 'inactive',
      hasExpiry: false,
      displayOnStorefront: true,
      threshold: '5',
      pricePerUnit: '10.5',
      purchasePrice: '8.4',
      wholesalePrice: '9.9',
    });
  });

  it('maps tax and warehouse form defaults', () => {
    expect(toTaxFormValues().status).toBe('active');
    expect(toWarehouseFormValues().status).toBe('active');
  });

  it('parses optional numbers safely', () => {
    expect(parseOptionalNumber('  ')).toBeUndefined();
    expect(parseOptionalNumber('abc')).toBeUndefined();
    expect(parseOptionalNumber('12.5')).toBe(12.5);
  });
});
