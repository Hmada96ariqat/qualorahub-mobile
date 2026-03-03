import {
  parseOptionalNumber,
  toCategoryFormValues,
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

  it('maps tax and warehouse form defaults', () => {
    expect(toTaxFormValues().status).toBe('active');
    expect(toWarehouseFormValues()).toEqual({
      name: '',
      fieldId: '',
      status: 'active',
      capacityValue: '',
      capacityUnit: '',
      temperatureMin: '',
      temperatureMax: '',
      warehouseTypes: [],
      safetyMeasures: '',
      notes: '',
    });
  });

  it('parses optional numbers safely', () => {
    expect(parseOptionalNumber('  ')).toBeUndefined();
    expect(parseOptionalNumber('abc')).toBeUndefined();
    expect(parseOptionalNumber('12.5')).toBe(12.5);
  });
});
