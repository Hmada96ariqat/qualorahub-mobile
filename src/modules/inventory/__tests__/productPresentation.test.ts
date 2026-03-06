import {
  buildProductOverviewCells,
  buildProductRowSubtitle,
  formatInventoryStatusLabel,
  formatProductTypeLabel,
  toInventoryStatusBadgeVariant,
  toProductIcon,
} from '../productPresentation';
import {
  buildCategoryOverviewCells,
  buildCategoryRowSubtitle,
} from '../categoryPresentation';

describe('inventory product presentation helpers', () => {
  const product = {
    id: 'product-1',
    name: 'Starter Seed',
    description: 'Primary seed lot',
    categoryId: 'category-1',
    taxId: 'tax-1',
    supplierId: 'supplier-1',
    manufacturerId: 'manufacturer-1',
    manufacturer: 'Maker A',
    productType: 'seed',
    otherProductType: null,
    usageType: 'Selling',
    source: null,
    unit: 'bag',
    sku: 'SEED-001',
    barcode: null,
    originCountry: 'Jordan',
    status: 'active',
    hasExpiry: true,
    displayOnStorefront: true,
    threshold: 4,
    pricePerUnit: 12.5,
    purchasePrice: 9,
    wholesalePrice: 10.5,
    productFormCode: null,
    activeIngredients: ['Alpha'],
    doseText: null,
    doseUnit: null,
    activeIngredientConcentrationPercent: null,
    phiMinDays: null,
    phiMaxDays: null,
    targetOrganismsText: null,
    referenceUrls: ['https://example.test/a'],
    cropGuidanceRows: [{ crop_id: 'crop-1' }],
    inventoryRecords: [{ warehouse_id: 'warehouse-1' }, { warehouse_id: 'warehouse-2' }],
    images: [],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  } as const;

  it('formats labels and row copy from canonical product values', () => {
    expect(formatProductTypeLabel(product.productType)).toBe('Seed');
    expect(formatInventoryStatusLabel(product.status)).toBe('Active');
    expect(toInventoryStatusBadgeVariant(product.status)).toBe('success');
    expect(buildProductRowSubtitle(product)).toBe('Seed · SKU SEED-001');
  });

  it('chooses product icons by family and derives overview cells', () => {
    expect(toProductIcon(product)).toBe('seed-outline');
    expect(toProductIcon({ ...product, productType: 'pesticide' })).toBe('spray');
    expect(toProductIcon({ ...product, productType: 'fuel' })).toBe('oil');

    expect(buildProductOverviewCells(product)).toEqual([
      { label: 'Usage', value: 'Selling' },
      { label: 'Sale Price', value: '$12.50' },
      { label: 'Expiry', value: 'Yes' },
      { label: 'Storefront', value: 'Visible' },
      { label: 'Inventory', value: '2' },
      { label: 'Guidance', value: '1' },
    ]);
  });

  it('formats category hierarchy and storefront copy', () => {
    const category = {
      id: 'category-1',
      name: 'Seeds',
      parentId: null,
      imageUrl: null,
      displayOnStorefront: true,
      notes: null,
      status: 'active',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    } as const;

    expect(
      buildCategoryRowSubtitle({ category, parentLabel: 'Top-level' }),
    ).toBe('Top-level · Visible on storefront');

    expect(buildCategoryOverviewCells({ category, parentLabel: undefined })).toEqual([
      { label: 'Parent', value: 'Top-level' },
      { label: 'Status', value: 'Active' },
      { label: 'Storefront', value: 'Visible' },
      { label: 'Image', value: 'None' },
    ]);
  });
});
