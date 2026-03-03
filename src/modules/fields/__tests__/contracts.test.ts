import {
  displayToHectares,
  formatDisplayArea,
  hectaresToDisplay,
  toFieldFormValues,
} from '../contracts';

describe('fields contracts', () => {
  it('maps field summary to form values', () => {
    const values = toFieldFormValues({
      id: 'field-1',
      name: 'North Field',
      areaHectares: '1.25',
      areaUnit: 'acres',
      status: 'active',
      shapePolygon: null,
      location: 'Zone A',
      soilType: 'loam',
      notes: 'Good drainage',
      soilTypeCategory: null,
      soilTypeOther: null,
      irrigationType: null,
      irrigationTypeOther: null,
      soilConditions: null,
      activeCycleSummary: null,
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });

    expect(values.name).toBe('North Field');
    expect(values.areaHectares).toBe('1.25');
    expect(values.areaUnit).toBe('acres');
    expect(values.manualAreaFallback.unit).toBe('acres');
    expect(values.location).toBe('Zone A');
    expect(values.soilType).toBe('loam');
    expect(values.notes).toBe('Good drainage');
  });

  it('converts hectares display values for acres and manzana parity', () => {
    expect(hectaresToDisplay(1, 'acres')).toBeCloseTo(2.4711, 3);
    expect(hectaresToDisplay(1, 'manzana')).toBeCloseTo(1.4285, 3);
    expect(displayToHectares(2.4711, 'acres')).toBeCloseTo(1, 3);
    expect(displayToHectares(1.4285, 'manzana')).toBeCloseTo(1, 3);
    expect(formatDisplayArea('1', 'hectares')).toBe('1.00');
  });
});
