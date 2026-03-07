import {
  collectPhiProductIds,
  computePhiRestrictionsForDate,
  getMostRestrictivePhiDate,
  summarizePhiRestrictionsByProduct,
} from '../phiRestrictions';

describe('phiRestrictions', () => {
  it('collects only applied product ids with non-negative phi days and preserves zero-day rows', () => {
    const productIds = collectPhiProductIds([
      {
        id: 'treatment-1',
        status: 'APPLIED',
        products: [
          { productId: 'product-zero', phiDays: 0 },
          { productId: 'product-five', phiDays: 5 },
          { productId: 'product-missing', phiDays: null },
          { productId: 'product-negative', phiDays: -1 },
        ],
      },
      {
        id: 'treatment-2',
        status: 'draft',
        products: [{ productId: 'ignored-draft', phiDays: 7 }],
      },
    ]);

    expect(productIds).toEqual(['product-zero', 'product-five']);
  });

  it('uses stored restricted-until dates, filters to pesticide-like products, and summarizes by the most restrictive date', () => {
    const restrictions = computePhiRestrictionsForDate({
      treatments: [
        {
          id: 'treatment-1',
          status: 'APPLIED',
          treatment_date: '2026-03-01',
          products: [
            {
              productId: 'product-a',
              phiDays: 7,
              restrictedUntilDate: '2026-03-15',
            },
            {
              productId: 'product-b',
              phiDays: 4,
            },
          ],
        },
        {
          id: 'treatment-2',
          status: 'APPLIED',
          treatment_date: '2026-03-03',
          products: [
            {
              productId: 'product-a',
              phiDays: 2,
            },
          ],
        },
      ],
      harvestDate: new Date('2026-03-10T00:00:00'),
      productMeta: [
        { id: 'product-a', name: 'Crop Spray', productType: 'pesticide' },
        { id: 'product-b', name: 'Base Feed', productType: 'fertilizer' },
      ],
      unknownProductLabel: 'Unknown product',
      restrictToPesticideProducts: true,
    });

    expect(restrictions).toHaveLength(2);
    expect(restrictions.map((entry) => entry.productId)).toEqual(['product-a', 'product-a']);
    expect(restrictions[0]?.restrictedUntilDate.toISOString().slice(0, 10)).toBe('2026-03-15');
    expect(restrictions[0]?.isActive).toBe(true);

    const summary = summarizePhiRestrictionsByProduct(restrictions);
    expect(summary).toHaveLength(1);
    expect(summary[0]).toMatchObject({
      productId: 'product-a',
      productName: 'Crop Spray',
      phiDays: 7,
      isActive: true,
    });
    expect(summary[0]?.restrictedUntilDate.toISOString().slice(0, 10)).toBe('2026-03-15');
    expect(getMostRestrictivePhiDate(summary)?.toISOString().slice(0, 10)).toBe('2026-03-15');
  });
});
