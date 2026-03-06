import {
  parseCsvValues,
  toAnimalFormValues,
  toHealthCheckFormValues,
  toHousingUnitFormValues,
  toWeatherRuleFormValues,
  toYieldRecordFormValues,
} from '../contracts';

describe('livestock contracts', () => {
  it('maps animal summary into form values', () => {
    const values = toAnimalFormValues({
      id: 'animal-1',
      name: 'Dairy Cow 1',
      species: 'cattle',
      breed: 'Holstein',
      tagNumber: 'C-101',
      healthStatus: 'healthy',
      activeStatus: 'active',
      quantity: 1,
      currentHousingUnitId: 'housing-1',
      groupId: 'group-1',
      lastVetVisit: '2026-03-01',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });

    expect(values).toEqual({
      name: 'Dairy Cow 1',
      species: 'cattle',
      breed: 'Holstein',
      tagNumber: 'C-101',
      healthStatus: 'healthy',
      activeStatus: 'active',
      quantity: '1',
      housingUnitId: 'housing-1',
      lastVetVisit: '2026-03-01',
      notes: '',
    });
  });

  it('maps health and yield records into editable form defaults', () => {
    expect(
      toHealthCheckFormValues({
        id: 'health-1',
        animalId: 'animal-1',
        date: '2026-03-02T00:00:00.000Z',
        status: 'healthy',
        notes: 'All clear',
        performedBy: 'Dr. Sam',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      }),
    ).toEqual({
      date: '2026-03-02',
      status: 'healthy',
      notes: 'All clear',
      performedBy: 'Dr. Sam',
    });

    expect(
      toYieldRecordFormValues({
        id: 'yield-1',
        animalId: 'animal-1',
        date: '2026-03-02T00:00:00.000Z',
        yieldType: 'milk',
        amount: 22,
        unit: 'L',
        notes: 'morning',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      }),
    ).toEqual({
      date: '2026-03-02',
      yieldType: 'milk',
      amount: '22',
      unit: 'L',
      notes: 'morning',
    });
  });

  it('maps housing/weather records and parses csv values', () => {
    expect(
      toHousingUnitFormValues({
        id: 'housing-1',
        barnName: 'Barn A',
        unitCode: 'A-1',
        fieldId: 'field-1',
        capacity: 60,
        currentStatus: 'active',
        animalTypes: ['cattle', 'goat'],
        shapePolygon: null,
        notes: 'Ventilated',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      }),
    ).toEqual({
      barnName: 'Barn A',
      unitCode: 'A-1',
      fieldId: 'field-1',
      capacity: '60',
      currentStatus: 'active',
      animalTypesCsv: 'cattle, goat',
      boundaryPoints: [],
      notes: 'Ventilated',
    });

    expect(
      toWeatherRuleFormValues({
        id: 'rule-1',
        lotId: 'lot-1',
        fieldId: 'field-1',
        name: 'Heat Watch',
        condition: 'temperature',
        operator: '>=',
        value: 35,
        unit: 'C',
        enabled: true,
        severity: 'high',
        customMessage: 'Check cooling',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      }),
    ).toMatchObject({
      lotId: 'lot-1',
      fieldId: 'field-1',
      name: 'Heat Watch',
      condition: 'temperature',
      operator: '>=',
      value: '35',
      unit: 'C',
      severity: 'high',
      enabled: true,
      customMessage: 'Check cooling',
      notifyInApp: true,
      notifyEmail: false,
      notifySms: false,
    });

    expect(parseCsvValues(' cattle, goat ,, poultry ')).toEqual(['cattle', 'goat', 'poultry']);
  });
});
