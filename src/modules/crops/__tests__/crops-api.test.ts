import {
  createCrop,
  createProductionCycleOperation,
  getLogbookSession,
  listCrops,
  listProductionCycles,
  submitLogbook,
} from '../../../api/modules/crops';

const originalFetch = global.fetch;

describe('crops api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses production cycles list payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 'cycle-1',
            field_id: 'field-1',
            lot_id: 'lot-1',
            crop_id: 'crop-1',
            status: 'Active',
            start_date: '2026-03-01T00:00:00.000Z',
            end_date: null,
            notes: 'Cycle note',
            estimated_cost: '42.5',
            actual_cost: '17.0',
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
            field: { id: 'field-1', name: 'North Field' },
            lot: { id: 'lot-1', name: 'Lot A' },
            crop: { id: 'crop-1', name: 'Tomato' },
          },
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const cycles = await listProductionCycles('token');

    expect(cycles).toEqual([
      {
        id: 'cycle-1',
        fieldId: 'field-1',
        fieldName: 'North Field',
        lotId: 'lot-1',
        lotName: 'Lot A',
        cropId: 'crop-1',
        cropName: 'Tomato',
        status: 'Active',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: null,
        notes: 'Cycle note',
        estimatedCost: 42.5,
        actualCost: 17,
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
    ]);
  });

  it('parses crops list payload from canonical crop endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 'crop-1',
            crop_name: 'Tomato',
            crop_variety: 'Roma',
            status: 'Active',
            notes: 'Field linked crop',
            field_id: 'field-1',
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          },
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const crops = await listCrops('token');

    expect(crops).toEqual([
      {
        id: 'crop-1',
        name: 'Tomato',
        variety: 'Roma',
        status: 'Active',
        notes: 'Field linked crop',
        fieldId: 'field-1',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
    ]);
  });

  it('builds crop create request payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 'crop-2',
          crop_name: 'Eggplant',
          crop_variety: 'Long Purple',
          status: 'Planned',
          notes: 'New crop',
          field_id: null,
          created_at: '2026-03-02T00:00:00.000Z',
          updated_at: '2026-03-02T00:00:00.000Z',
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createCrop('token', {
      payload: {
        crop_name: 'Eggplant',
        crop_variety: 'Long Purple',
        notes: 'New crop',
      },
    });

    const [url, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Record<string, string>;
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(url).toBe('http://127.0.0.1:3300/api/v1/crops');
    expect(options.method).toBe('POST');
    expect(headers.Authorization).toBe('Bearer token');
    expect(headers['Idempotency-Key']).toEqual(expect.stringMatching(/^crops-create-/));
    expect(body).toEqual({
      payload: {
        crop_name: 'Eggplant',
        crop_variety: 'Long Purple',
        notes: 'New crop',
      },
    });
  });

  it('loads logbook session with query params and submits logbook payload', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            date: '2026-03-02',
            selectedFieldId: 'field-1',
            fields: [{ id: 'field-1', name: 'North Field', status: 'active' }],
            categories: [
              {
                key: 'CROP_OPERATION',
                label: 'Crop Operation',
                entityType: 'CROP',
                families: [{ key: 'LAND_PREP', label: 'Land Prep' }],
              },
            ],
            entitiesByCategory: {
              CROP_OPERATION: [
                { id: 'cycle-1', name: 'Tomato Cycle', type: 'CROP', fieldId: 'field-1' },
              ],
            },
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            status: 'saved',
            recordId: 'log-1',
            category: 'CROP_OPERATION',
            family: 'LAND_PREP',
            entityId: 'cycle-1',
            requires_followup: false,
          }),
        headers: { get: () => null },
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const session = await getLogbookSession('token', { fieldId: 'field-1', date: '2026-03-02' });
    const result = await submitLogbook('token', {
      fieldId: 'field-1',
      date: '2026-03-02',
      category: 'CROP_OPERATION',
      entityType: 'CROP',
      entityId: 'cycle-1',
      family: 'LAND_PREP',
      payload: { notes: 'done' },
    });

    const [firstUrl] = fetchMock.mock.calls[0] as [string];
    const [submitUrl, submitOptions] = fetchMock.mock.calls[1];

    expect(firstUrl).toBe(
      'http://127.0.0.1:3300/api/v1/logbook/session?fieldId=field-1&date=2026-03-02',
    );
    expect(session.fields[0]?.id).toBe('field-1');
    expect(submitUrl).toBe('http://127.0.0.1:3300/api/v1/logbook/submit');
    expect((submitOptions.headers as Record<string, string>)['Idempotency-Key']).toEqual(
      expect.stringMatching(/^logbook-submit-/),
    );
    expect(result).toEqual({
      status: 'saved',
      recordId: 'log-1',
      category: 'CROP_OPERATION',
      family: 'LAND_PREP',
      entityId: 'cycle-1',
      requiresFollowup: false,
    });
  });

  it('creates cycle operation with idempotency key', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 'op-1',
          cycle_id: 'cycle-1',
          type: 'LAND_PREP',
          status: 'draft',
          date: '2026-03-02T00:00:00.000Z',
          performed_by_id: null,
          quantity: null,
          unit: null,
          cost: '22',
          notes: 'prep',
          practice_id: null,
          created_at: '2026-03-02T00:00:00.000Z',
          updated_at: '2026-03-02T00:00:00.000Z',
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createProductionCycleOperation('token', 'cycle-1', {
      date: '2026-03-02',
      type: 'LAND_PREP',
      cost: 22,
      notes: 'prep',
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:3300/api/v1/production-cycles/cycle-1/operations');
    expect(options.method).toBe('POST');
    expect((options.headers as Record<string, string>)['Idempotency-Key']).toEqual(
      expect.stringMatching(/^production-cycle-operations-create-cycle-1-/),
    );
  });
});
