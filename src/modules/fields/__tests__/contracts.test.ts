import { toFieldFormValues } from '../contracts';

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
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });

    expect(values).toEqual({
      name: 'North Field',
      areaHectares: '1.25',
      areaUnit: 'acres',
      boundaryPoints: [],
      location: 'Zone A',
      soilType: 'loam',
      notes: 'Good drainage',
    });
  });
});
