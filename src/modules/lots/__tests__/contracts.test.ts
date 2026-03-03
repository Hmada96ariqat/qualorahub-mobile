import { toLotFormValues } from '../contracts';

describe('lots contracts', () => {
  it('maps lot summary to form values', () => {
    const values = toLotFormValues({
      id: 'lot-1',
      fieldId: 'field-1',
      name: 'Lot A',
      description: null,
      lotType: 'greenhouse',
      lotTypeOther: null,
      cropRotationPlan: 'rotation',
      cropRotationPlanOther: null,
      lightProfile: 'partial_shade',
      shapePolygon: null,
      pastSeasonsCrops: [],
      weatherAlertsEnabled: false,
      notes: 'Keep shaded',
      status: 'active',
      fieldName: 'North Field',
      fieldStatus: 'active',
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });

    expect(values.fieldId).toBe('field-1');
    expect(values.name).toBe('Lot A');
    expect(values.lotType).toBe('greenhouse');
    expect(values.cropRotationPlan).toBe('monoculture');
    expect(values.lightProfile).toBe('partial_shade');
    expect(values.boundaryPoints).toEqual([]);
    expect(values.notes).toBe('Keep shaded');
  });
});
