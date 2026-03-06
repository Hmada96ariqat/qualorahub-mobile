import {
  createEquipment,
  createMaintenanceRecord,
  createUsageLog,
  listEquipment,
  listMaintenanceRecords,
  listUpcomingMaintenance,
  listUsageLogs,
  replaceMaintenanceParts,
  updateEquipment,
} from '../../../api/modules/equipment';

const originalFetch = global.fetch;

describe('equipment api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses equipment list from dashboard snapshot payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          equipment: [
            {
              id: 'eq-1',
              name: 'North Tractor',
              type: 'tractor',
              status: 'operational',
              serial_number: 'SN-12',
              notes: 'Ready',
              next_maintenance_date: '2026-03-14',
              created_at: '2026-03-02T00:00:00.000Z',
              updated_at: '2026-03-02T00:00:00.000Z',
            },
          ],
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const rows = await listEquipment('token');

    expect(rows).toEqual([
      {
        id: 'eq-1',
        name: 'North Tractor',
        type: 'tractor',
        status: 'operational',
        serialNumber: 'SN-12',
        notes: 'Ready',
        nextMaintenanceDate: '2026-03-14',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
    ]);
  });

  it('builds command payload wrapper for equipment create and update with km support', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'eq-2',
            name: 'South Harvester',
            type: 'harvester',
            status: 'operational',
            serial_number: 'HS-20',
            track_usage: 'km',
            current_usage_reading: 1250.5,
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              id: 'eq-2',
              name: 'South Harvester',
              type: 'harvester',
              status: 'inactive',
              serial_number: 'HS-20',
              track_usage: 'km',
              current_usage_reading: 1300,
              created_at: '2026-03-02T00:00:00.000Z',
              updated_at: '2026-03-02T00:00:00.000Z',
            },
          ]),
        headers: { get: () => null },
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    await createEquipment('token', {
      name: 'South Harvester',
      type: 'harvester',
      status: 'operational',
      serial_number: 'HS-20',
      track_usage: 'km',
      current_usage_reading: 1250.5,
    });

    await updateEquipment('token', 'eq-2', {
      status: 'inactive',
      current_usage_reading: 1300,
    });

    const [createUrl, createOptions] = fetchMock.mock.calls[0];
    const [updateUrl, updateOptions] = fetchMock.mock.calls[1];
    const createHeaders = createOptions.headers as Record<string, string>;

    expect(createUrl).toBe('http://127.0.0.1:3300/api/v1/equipment');
    expect(createOptions.method).toBe('POST');
    expect(createHeaders.Authorization).toBe('Bearer token');
    expect(createHeaders['Idempotency-Key']).toEqual(expect.stringMatching(/^equipment-create-/));
    expect(JSON.parse(createOptions.body as string)).toEqual({
      payload: {
        name: 'South Harvester',
        type: 'harvester',
        status: 'operational',
        serial_number: 'HS-20',
        track_usage: 'km',
        current_usage_reading: 1250.5,
      },
    });

    expect(updateUrl).toBe('http://127.0.0.1:3300/api/v1/equipment/eq-2');
    expect(updateOptions.method).toBe('PATCH');
    expect(JSON.parse(updateOptions.body as string)).toEqual({
      payload: {
        status: 'inactive',
        current_usage_reading: 1300,
      },
    });
  });

  it('builds usage and maintenance payloads and parses enriched responses', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'usage-1',
            equipment_id: 'eq-1',
            usage_purpose: 'tilling',
            operator_id: 'contact-1',
            used_by_id: 'contact-2',
            field_id: 'field-1',
            lot_id: 'lot-1',
            date_used: '2026-03-02T00:00:00.000Z',
            total_hours_used: '2',
            total_used: '2',
            starting_reading: 10,
            ending_reading: 12,
            fuel_consumables_used: '4 L diesel',
            usage_description: 'Prep',
            keywords_tags: ['prep'],
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'maint-1',
            equipment_id: 'eq-1',
            service_type: 'scheduled',
            service_description: 'Oil change',
            service_performed_by: 'user:11111111-1111-4111-8111-111111111111',
            date_performed: '2026-03-02',
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              id: 'usage-2',
              equipment_id: 'eq-1',
              usage_purpose: 'Transport/Delivery',
              operator_id: 'contact-1',
              used_by_id: 'contact-2',
              field_id: 'field-2',
              lot_id: 'lot-9',
              date_used: '2026-03-03T00:00:00.000Z',
              total_used: '18.5',
              fuel_used: '2 cans',
              usage_description: null,
              operator: { id: 'contact-1', name: 'Operator One', email: 'one@example.com' },
              used_by: { id: 'contact-2', name: 'Operator Two' },
              field: { id: 'field-2', name: 'South Field' },
              lot: { id: 'lot-9', name: 'Lot 9' },
              keywords_tags: [],
              created_at: '2026-03-03T00:00:00.000Z',
              updated_at: '2026-03-03T00:00:00.000Z',
            },
          ]),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              id: 'maint-2',
              equipment_id: 'eq-1',
              service_type: 'preventive',
              service_description: 'Oil change',
              date_performed: '2026-03-02T00:00:00.000Z',
              next_maintenance_due: '2026-04-02T00:00:00.000Z',
              total_cost: 120,
              current_meter_reading: 1200,
              performed_by: {
                kind: 'contact',
                id: '22222222-2222-4222-8222-222222222222',
                name: 'Vendor Crew',
              },
              maintenance_parts: [
                {
                  id: 'part-1',
                  maintenance_record_id: 'maint-2',
                  product_id: 'product-1',
                  quantity: 2,
                  unit_cost: 10,
                  total_cost: 20,
                  products: {
                    name: 'Filter',
                    unit: 'each',
                  },
                },
              ],
              created_at: '2026-03-02T00:00:00.000Z',
              updated_at: '2026-03-02T00:00:00.000Z',
            },
          ]),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              id: 'up-1',
              equipment_id: 'eq-1',
              equipment_name: 'North Tractor',
              due_date: '2026-03-18',
              status: 'scheduled',
              days_until_due: 3,
            },
          ]),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ replacedCount: 1 }),
        headers: { get: () => null },
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    await createUsageLog('token', 'eq-1', {
      operator_id: 'contact-1',
      used_by_id: 'contact-2',
      field_id: 'field-1',
      lot_id: 'lot-1',
      usage_purpose: 'tilling',
      usage_description: 'Prep',
      starting_reading: 10,
      ending_reading: 12,
      total_used: 2,
      total_hours_used: 2,
      fuel_consumables_used: '4 L diesel',
    });

    await createMaintenanceRecord('token', 'eq-1', {
      service_type: 'scheduled',
      service_description: 'Oil change',
      date_performed: '2026-03-02',
      service_performed_by: 'user:11111111-1111-4111-8111-111111111111',
    });

    const usage = await listUsageLogs('token', 'eq-1');
    const maintenance = await listMaintenanceRecords('token', 'eq-1');
    const upcoming = await listUpcomingMaintenance('token');
    const replaceResult = await replaceMaintenanceParts('token', 'maint-2', [
      {
        product_id: 'product-1',
        quantity: 2,
        unit_cost: 10,
        total_cost: 20,
        farm_id: 'farm-1',
      },
    ]);

    const [createUsageUrl, createUsageOptions] = fetchMock.mock.calls[0];
    const usageHeaders = createUsageOptions.headers as Record<string, string>;
    const [, createMaintenanceOptions] = fetchMock.mock.calls[1];
    const [, replacePartsOptions] = fetchMock.mock.calls[5];

    expect(createUsageUrl).toBe('http://127.0.0.1:3300/api/v1/equipment/eq-1/usage-logs');
    expect(createUsageOptions.method).toBe('POST');
    expect(usageHeaders['Idempotency-Key']).toEqual(
      expect.stringMatching(/^equipment-usage-create-/),
    );
    expect(JSON.parse(createUsageOptions.body as string)).toEqual({
      payload: {
        operator_id: 'contact-1',
        used_by_id: 'contact-2',
        field_id: 'field-1',
        lot_id: 'lot-1',
        usage_purpose: 'tilling',
        usage_description: 'Prep',
        starting_reading: 10,
        ending_reading: 12,
        total_used: 2,
        total_hours_used: 2,
        fuel_consumables_used: '4 L diesel',
      },
    });

    expect(JSON.parse(createMaintenanceOptions.body as string)).toEqual({
      payload: {
        service_type: 'scheduled',
        service_description: 'Oil change',
        date_performed: '2026-03-02',
        service_performed_by: 'user:11111111-1111-4111-8111-111111111111',
      },
    });

    expect(JSON.parse(replacePartsOptions.body as string)).toEqual({
      parts: [
        {
          product_id: 'product-1',
          quantity: 2,
          unit_cost: 10,
          total_cost: 20,
          farm_id: 'farm-1',
        },
      ],
    });

    expect(usage[0]).toMatchObject({
      usagePurpose: 'Transport/Delivery',
      operatorId: 'contact-1',
      usedById: 'contact-2',
      fieldId: 'field-2',
      lotId: 'lot-9',
      fuelConsumablesUsed: '2 cans',
      operator: { id: 'contact-1', name: 'Operator One' },
      usedBy: { id: 'contact-2', name: 'Operator Two' },
      field: { id: 'field-2', name: 'South Field' },
      lot: { id: 'lot-9', name: 'Lot 9' },
    });
    expect(maintenance[0]).toMatchObject({
      servicePerformedBy: 'contact:22222222-2222-4222-8222-222222222222',
      performedBy: {
        kind: 'contact',
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Vendor Crew',
      },
      currentMeterReading: '1200',
      partsCount: 1,
    });
    expect(maintenance[0]?.parts[0]).toMatchObject({
      productId: 'product-1',
      productName: 'Filter',
      productUnit: 'each',
    });
    expect(upcoming[0]).toMatchObject({
      equipmentId: 'eq-1',
      equipmentName: 'North Tractor',
      dueDate: '2026-03-18',
      daysUntilDue: 3,
    });
    expect(replaceResult).toEqual({ replacedCount: 1 });
  });
});
