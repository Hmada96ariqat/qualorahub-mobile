import {
  getTrackUsageLabel,
  normalizeEquipmentStatus,
  normalizeServiceType,
  normalizeTrackUsage,
  normalizeUsagePurpose,
  parseMaintenancePerformerReference,
  toEquipmentFormValues,
  toMaintenanceFormValues,
  toUsageLogFormValues,
} from '../contracts';

describe('equipment contracts', () => {
  it('maps equipment detail into form values with track usage fields', () => {
    const values = toEquipmentFormValues({
      id: 'eq-1',
      name: 'North Tractor',
      type: 'tractor',
      status: 'maintenance',
      serialNumber: 'SN-100',
      notes: 'Needs tire check',
      nextMaintenanceDate: '2026-03-12',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      brand: null,
      model: null,
      modelYear: null,
      trackUsage: 'km',
      currentUsageReading: '1450.5',
      estimatedUsageCost: null,
    });

    expect(values).toEqual({
      name: 'North Tractor',
      type: 'tractor',
      status: 'maintenance',
      serialNumber: 'SN-100',
      trackUsage: 'km',
      currentUsageReading: '1450.5',
      notes: 'Needs tire check',
    });
  });

  it('maps enriched usage and maintenance records into form values', () => {
    const usageValues = toUsageLogFormValues({
      id: 'usage-1',
      equipmentId: 'eq-1',
      usagePurpose: 'Labranza',
      operatorId: 'contact-legacy',
      operator: { id: 'contact-1', name: 'Operator One' },
      usedById: 'contact-legacy-2',
      usedBy: { id: 'contact-2', name: 'Operator Two' },
      fieldId: 'field-legacy',
      field: { id: 'field-1', name: 'North Field' },
      lotId: 'lot-legacy',
      lot: { id: 'lot-1', name: 'Lot A' },
      dateUsed: '2026-03-04T10:30:00.000Z',
      startDateTime: null,
      endDateTime: null,
      startingReading: '100',
      endingReading: '104.5',
      totalUsed: '4.5',
      totalHoursUsed: '4.5',
      fuelConsumablesUsed: '15 L diesel',
      cost: '22.50',
      usageDescription: 'Planting prep',
      keywords: ['prep'],
      createdAt: '2026-03-04T10:30:00.000Z',
      updatedAt: '2026-03-04T10:30:00.000Z',
    });

    const maintenanceValues = toMaintenanceFormValues(
      {
        id: 'maint-1',
        equipmentId: 'eq-1',
        serviceType: 'emergency',
        serviceDescription: 'Hydraulic leak fix',
        servicePerformedBy: null,
        performedBy: {
          kind: 'contact',
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Vendor Crew',
        },
        datePerformed: '2026-03-02T00:00:00.000Z',
        nextMaintenanceDue: '2026-04-02T00:00:00.000Z',
        currentMeterReading: '105',
        totalCost: '120',
        laborCost: null,
        partsCost: null,
        vendorFee: null,
        partsCount: 1,
        parts: [],
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
      {
        contacts: [{ id: '22222222-2222-4222-8222-222222222222', name: 'Vendor Crew' }],
      },
    );

    expect(usageValues).toMatchObject({
      usagePurpose: 'tilling',
      operatorId: 'contact-1',
      usedById: 'contact-2',
      fieldId: 'field-1',
      lotId: 'lot-1',
      dateUsed: '2026-03-04',
      startingReading: '100',
      endingReading: '104.5',
      durationHours: '4.5',
      fuelConsumablesUsed: '15 L diesel',
      cost: '22.50',
      usageDescription: 'Planting prep',
    });
    expect(maintenanceValues).toMatchObject({
      serviceType: 'emergency',
      serviceDescription: 'Hydraulic leak fix',
      datePerformed: '2026-03-02',
      nextMaintenanceDue: '2026-04-02',
      servicePerformedBy: 'contact:22222222-2222-4222-8222-222222222222',
    });
  });

  it('normalizes enum values safely to canonical options', () => {
    expect(normalizeEquipmentStatus('UNKNOWN')).toBe('operational');
    expect(normalizeTrackUsage('unsupported')).toBe('hours');
    expect(getTrackUsageLabel('miles')).toBe('Miles');
    expect(normalizeUsagePurpose('unsupported')).toBe('other');
    expect(normalizeUsagePurpose('الحراثة')).toBe('tilling');
    expect(normalizeServiceType('unsupported')).toBe('preventive');
  });

  it('parses maintenance performer references', () => {
    expect(parseMaintenancePerformerReference('')).toEqual({
      valid: true,
      value: null,
      type: null,
      id: null,
    });
    expect(parseMaintenancePerformerReference('user:123e4567-e89b-12d3-a456-426614174000')).toEqual(
      {
        valid: true,
        value: 'user:123e4567-e89b-12d3-a456-426614174000',
        type: 'user',
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
    );
    expect(
      parseMaintenancePerformerReference('contact:123E4567-E89B-12D3-A456-426614174000'),
    ).toEqual({
      valid: true,
      value: 'contact:123e4567-e89b-12d3-a456-426614174000',
      type: 'contact',
      id: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(parseMaintenancePerformerReference('Ops Team')).toEqual({
      valid: false,
      value: null,
      type: null,
      id: null,
    });
  });
});
