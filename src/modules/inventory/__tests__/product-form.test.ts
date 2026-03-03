import {
  buildProductPayload,
  clearRegulatoryAgronomicFields,
  createEmptyProductFormValues,
  getVisibleProductSteps,
  isPesticideFamilyProductType,
  toProductFormValues,
  validateProductFormValues,
} from '../product-form';

describe('inventory product form parity helpers', () => {
  it('computes wizard visibility by product type', () => {
    expect(isPesticideFamilyProductType('pesticide')).toBe(true);
    expect(isPesticideFamilyProductType('fungicide')).toBe(true);
    expect(isPesticideFamilyProductType('seed')).toBe(false);

    expect(getVisibleProductSteps('pesticide')).toEqual(['a', 'b', 'c']);
    expect(getVisibleProductSteps('seed')).toEqual(['a', 'c']);
  });

  it('clears regulatory fields when product type switches away from pesticide family', () => {
    const values = {
      ...createEmptyProductFormValues(),
      productType: 'pesticide',
      productFormCode: 'EC',
      activeIngredients: ['Abamectin'],
      doseText: '5',
      doseUnit: 'ml',
      doseUnitOtherText: 'custom',
      phiMinDays: '3',
      phiMaxDays: '7',
      targetOrganismsText: 'Mites',
      referenceUrls: ['https://example.test'],
      cropGuidanceRows: [
        {
          cropId: 'crop-1',
          regionScope: 'north',
          targetOrganismsText: 'Mites',
          doseText: '3',
          doseUnit: 'ml',
          phiDays: '3',
          reiHours: '24',
          notes: 'note',
          referenceUrls: ['https://row.example.test'],
        },
      ],
    };

    expect(clearRegulatoryAgronomicFields(values)).toMatchObject({
      productFormCode: '',
      activeIngredients: [],
      doseText: '',
      doseUnit: '',
      doseUnitOtherText: '',
      phiMinDays: '',
      phiMaxDays: '',
      targetOrganismsText: '',
      referenceUrls: [],
      cropGuidanceRows: [],
    });
  });

  it('validates required fields and pesticide-specific constraints', () => {
    const requiredErrors = validateProductFormValues(createEmptyProductFormValues());
    expect(requiredErrors).toMatchObject({
      name: 'Product name is required.',
      productType: 'Product type is required.',
    });

    const pesticideErrors = validateProductFormValues({
      ...createEmptyProductFormValues(),
      name: 'Pesticide Alpha',
      productType: 'pesticide',
      usageType: 'Both',
      doseUnit: 'other',
      doseUnitOtherText: '',
      phiMinDays: '10',
      phiMaxDays: '5',
    });

    expect(pesticideErrors).toMatchObject({
      doseUnitOtherText: 'Dose unit text is required when dose unit is "other".',
      phiMaxDays: 'Max PHI must be greater than or equal to Min PHI.',
    });
  });

  it('maps payload parity rules for submit', () => {
    const payload = buildProductPayload({
      ...createEmptyProductFormValues(),
      name: 'Field Product',
      productType: 'other',
      otherProductType: 'custom_type',
      usageType: 'FarmInput',
      displayOnStorefront: true,
      manufacturerId: 'manufacturer-1',
      manufacturer: 'Maker A',
      doseUnit: 'other',
      doseUnitOtherText: 'kg/acre',
      activeIngredients: ['Abamectin', 'Abamectin'],
      referenceUrls: ['https://a.test', 'https://a.test', 'https://b.test'],
      cropGuidanceRows: [
        {
          cropId: '',
          regionScope: 'ignored-row',
          targetOrganismsText: '',
          doseText: '',
          doseUnit: '',
          phiDays: '',
          reiHours: '',
          notes: '',
          referenceUrls: [],
        },
        {
          cropId: 'crop-1',
          regionScope: 'north',
          targetOrganismsText: 'Mites',
          doseText: '2',
          doseUnit: 'ml',
          phiDays: '3',
          reiHours: '12',
          notes: 'note',
          referenceUrls: ['https://row.test'],
        },
      ],
      inventoryRecords: [
        {
          batchNumber: 'batch-1',
          warehouseId: 'warehouse-1',
          quantity: '10',
          manufacturingDate: '2026-03-01',
          expiryDate: '2026-06-01',
          expiryDays: '90',
          notes: 'inventory note',
        },
      ],
      imagesExisting: ['https://existing.test/a.png'],
      imagesNew: ['https://new.test/b.png'],
    });

    expect(payload).toMatchObject({
      name: 'Field Product',
      product_type: 'other',
      other_product_type: 'custom_type',
      usage_type: 'FarmInput',
      display_on_storefront: false,
      manufacturer_id: 'manufacturer-1',
      manufacturer: 'Maker A',
      dose_unit: 'kg/acre',
      active_ingredients: ['Abamectin'],
      reference_urls: ['https://a.test', 'https://b.test'],
      crop_guidance_rows: [
        {
          crop_id: 'crop-1',
          region_scope: 'north',
          target_organisms_text: 'Mites',
          dose_text: '2',
          dose_unit: 'ml',
          phi_days: 3,
          rei_hours: 12,
          notes: 'note',
          reference_urls: ['https://row.test'],
        },
      ],
      inventoryRecords: [
        {
          batch_number: 'batch-1',
          warehouse_id: 'warehouse-1',
          quantity: 10,
          manufacturing_date: '2026-03-01',
          expiry_date: '2026-06-01',
          expired_after_days: 90,
          notes: 'inventory note',
        },
      ],
      images: ['https://existing.test/a.png', 'https://new.test/b.png'],
    });
  });

  it('normalizes custom stored dose units on edit', () => {
    const mapped = toProductFormValues({
      id: 'product-1',
      name: 'Pesticide Beta',
      description: null,
      categoryId: null,
      taxId: null,
      supplierId: null,
      manufacturerId: null,
      manufacturer: null,
      productType: 'pesticide',
      otherProductType: null,
      usageType: 'Both',
      source: null,
      unit: null,
      sku: null,
      barcode: null,
      originCountry: null,
      status: 'active',
      hasExpiry: false,
      displayOnStorefront: false,
      threshold: null,
      pricePerUnit: null,
      purchasePrice: null,
      wholesalePrice: null,
      productFormCode: null,
      activeIngredients: [],
      doseText: null,
      doseUnit: 'kg/acre',
      activeIngredientConcentrationPercent: null,
      phiMinDays: null,
      phiMaxDays: null,
      targetOrganismsText: null,
      referenceUrls: [],
      cropGuidanceRows: [],
      inventoryRecords: [],
      images: [],
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });

    expect(mapped.doseUnit).toBe('other');
    expect(mapped.doseUnitOtherText).toBe('kg/acre');
    expect(mapped.inventoryRecords).toHaveLength(1);
  });
});
