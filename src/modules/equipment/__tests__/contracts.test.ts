import {
  normalizeEquipmentStatus,
  normalizeServiceType,
  normalizeUsagePurpose,
  toEquipmentFormValues,
  toMaintenanceFormValues,
  toUsageLogFormValues,
} from '../contracts';

describe('equipment contracts', () => {
  it('maps equipment detail into form values', () => {
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
      trackUsage: null,
      currentUsageReading: null,
      estimatedUsageCost: null,
    });

    expect(values).toEqual({
      name: 'North Tractor',
      type: 'tractor',
      status: 'maintenance',
      serialNumber: 'SN-100',
      notes: 'Needs tire check',
    });
  });

  it('maps usage and maintenance records into form values', () => {
    const usageValues = toUsageLogFormValues({
      id: 'usage-1',
      equipmentId: 'eq-1',
      usagePurpose: 'field_work',
      operatorId: 'op-1',
      fieldId: 'field-1',
      lotId: null,
      dateUsed: '2026-03-04T10:30:00.000Z',
      totalHoursUsed: '2.5',
      usageDescription: 'Planting prep',
      keywords: ['prep'],
      createdAt: '2026-03-04T10:30:00.000Z',
      updatedAt: '2026-03-04T10:30:00.000Z',
    });

    const maintenanceValues = toMaintenanceFormValues({
      id: 'maint-1',
      equipmentId: 'eq-1',
      serviceType: 'emergency',
      serviceDescription: 'Hydraulic leak fix',
      servicePerformedBy: 'Ops Team',
      datePerformed: '2026-03-02T00:00:00.000Z',
      nextMaintenanceDue: '2026-04-02T00:00:00.000Z',
      totalCost: '120',
      partsCount: 1,
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });

    expect(usageValues).toMatchObject({
      usagePurpose: 'field_work',
      operatorId: 'op-1',
      fieldId: 'field-1',
      dateUsed: '2026-03-04',
      usageDescription: 'Planting prep',
    });
    expect(maintenanceValues).toMatchObject({
      serviceType: 'emergency',
      serviceDescription: 'Hydraulic leak fix',
      datePerformed: '2026-03-02',
      nextMaintenanceDue: '2026-04-02',
      servicePerformedBy: 'Ops Team',
    });
  });

  it('normalizes unknown enum values safely', () => {
    expect(normalizeEquipmentStatus('UNKNOWN')).toBe('operational');
    expect(normalizeUsagePurpose('unsupported')).toBe('general');
    expect(normalizeServiceType('unsupported')).toBe('preventive');
  });
});
