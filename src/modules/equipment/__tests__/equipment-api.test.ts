import {
  createEquipment,
  createUsageLog,
  listEquipment,
  listMaintenanceRecords,
  listUpcomingMaintenance,
  listUsageLogs,
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

  it('builds command payload wrapper for equipment create and update', async () => {
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
    });

    await updateEquipment('token', 'eq-2', {
      status: 'inactive',
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
      },
    });

    expect(updateUrl).toBe('http://127.0.0.1:3300/api/v1/equipment/eq-2');
    expect(updateOptions.method).toBe('PATCH');
    expect(JSON.parse(updateOptions.body as string)).toEqual({
      payload: {
        status: 'inactive',
      },
    });
  });

  it('builds payload wrapper for usage logs and parses usage + maintenance reads', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'usage-1',
            equipment_id: 'eq-1',
            usage_purpose: 'general',
            operator_id: 'op-1',
            field_id: 'field-1',
            date_used: '2026-03-02T00:00:00.000Z',
            total_hours_used: '2',
            usage_description: 'Prep',
            keywords_tags: ['prep'],
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
              usage_purpose: 'transport',
              operator_id: 'op-1',
              field_id: 'field-2',
              date_used: '2026-03-03T00:00:00.000Z',
              total_hours_used: '1.5',
              usage_description: null,
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
              id: 'maint-1',
              equipment_id: 'eq-1',
              service_type: 'preventive',
              service_description: 'Oil change',
              date_performed: '2026-03-02T00:00:00.000Z',
              next_maintenance_due: '2026-04-02T00:00:00.000Z',
              total_cost: '120',
              maintenance_parts: [{ id: 'part-1' }],
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
              service_type: 'preventive',
              due_date: '2026-03-18',
              status: 'scheduled',
              days_until_due: 3,
            },
          ]),
        headers: { get: () => null },
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    await createUsageLog('token', 'eq-1', {
      operator_id: 'op-1',
      field_id: 'field-1',
      usage_purpose: 'general',
      usage_description: 'Prep',
    });
    const usage = await listUsageLogs('token', 'eq-1');
    const maintenance = await listMaintenanceRecords('token', 'eq-1');
    const upcoming = await listUpcomingMaintenance('token');

    const [createUrl, createOptions] = fetchMock.mock.calls[0];
    const createHeaders = createOptions.headers as Record<string, string>;

    expect(createUrl).toBe('http://127.0.0.1:3300/api/v1/equipment/eq-1/usage-logs');
    expect(createOptions.method).toBe('POST');
    expect(createHeaders['Idempotency-Key']).toEqual(
      expect.stringMatching(/^equipment-usage-create-/),
    );
    expect(JSON.parse(createOptions.body as string)).toEqual({
      payload: {
        operator_id: 'op-1',
        field_id: 'field-1',
        usage_purpose: 'general',
        usage_description: 'Prep',
      },
    });

    expect(usage[0]?.usagePurpose).toBe('transport');
    expect(maintenance[0]?.partsCount).toBe(1);
    expect(upcoming[0]).toMatchObject({
      equipmentId: 'eq-1',
      equipmentName: 'North Tractor',
      daysUntilDue: 3,
    });
  });
});
