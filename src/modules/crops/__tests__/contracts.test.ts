import {
  normalizeCycleListMode,
  toCropFormValues,
  toCycleCloseFormValues,
  toCycleFormValues,
  toLogbookFormValues,
  toOperationFormValues,
} from '../contracts';

describe('crops contracts', () => {
  it('maps crop summary into crop form values', () => {
    const values = toCropFormValues({
      id: 'crop-1',
      name: 'Tomato',
      variety: 'Cherry',
      status: 'Planned',
      notes: 'Notes',
      fieldId: null,
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });

    expect(values).toEqual({
      cropName: 'Tomato',
      cropVariety: 'Cherry',
      notes: 'Notes',
    });
  });

  it('maps cycle summary and close defaults', () => {
    const cycle = {
      id: 'cycle-1',
      fieldId: 'field-1',
      fieldName: 'North Field',
      lotId: 'lot-1',
      lotName: 'Lot A',
      cropId: 'crop-1',
      cropName: 'Tomato',
      status: 'Closed',
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-03-10T00:00:00.000Z',
      notes: 'done',
      estimatedCost: 10,
      actualCost: 12,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
    };

    expect(toCycleFormValues(cycle)).toEqual({
      fieldId: 'field-1',
      lotId: 'lot-1',
      cropId: 'crop-1',
      startDate: '2026-03-01',
      notes: 'done',
    });

    expect(toCycleCloseFormValues(cycle)).toEqual({
      endDate: '2026-03-10',
      notes: 'done',
    });
  });

  it('maps operation form values and list mode normalization', () => {
    expect(
      toOperationFormValues({
        id: 'op-1',
        cycleId: 'cycle-1',
        type: 'PLANTING',
        status: 'draft',
        date: '2026-03-09T00:00:00.000Z',
        performedById: null,
        quantity: null,
        unit: null,
        cost: 23,
        notes: 'operation note',
        practiceId: null,
        createdAt: '2026-03-09T00:00:00.000Z',
        updatedAt: '2026-03-09T00:00:00.000Z',
      }),
    ).toEqual({
      date: '2026-03-09',
      type: 'PLANTING',
      cost: '23',
      notes: 'operation note',
    });

    expect(normalizeCycleListMode('Active')).toBe('active');
    expect(normalizeCycleListMode('Closed')).toBe('closed');
    expect(normalizeCycleListMode('other')).toBe('all');
  });

  it('creates default logbook form values', () => {
    const values = toLogbookFormValues('field-1');

    expect(values.fieldId).toBe('field-1');
    expect(values.category).toBe('CROP_OPERATION');
    expect(values.entityType).toBe('CROP');
    expect(values.family).toBe('LAND_PREP');
    expect(values.payloadText).toContain('notes');
  });
});
