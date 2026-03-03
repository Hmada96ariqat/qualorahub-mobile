import { toLotFormValues } from '../contracts';

describe('lots contracts', () => {
  it('maps lot summary to form values', () => {
    const values = toLotFormValues({
      id: 'lot-1',
      fieldId: 'field-1',
      name: 'Lot A',
      lotType: 'greenhouse',
      cropRotationPlan: 'rotation',
      lightProfile: 'partial_shade',
      shapePolygon: null,
      weatherAlertsEnabled: false,
      notes: 'Keep shaded',
      status: 'active',
      fieldName: 'North Field',
      fieldStatus: 'active',
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });

    expect(values).toEqual({
      fieldId: 'field-1',
      name: 'Lot A',
      lotType: 'greenhouse',
      cropRotationPlan: 'rotation',
      lightProfile: 'partial_shade',
      boundaryPoints: [],
      notes: 'Keep shaded',
    });
  });
});
