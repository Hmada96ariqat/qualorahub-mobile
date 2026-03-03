import { createLot, listLots, reactivateLot } from '../../../api/modules/lots';

const originalFetch = global.fetch;

describe('lots api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses lot list payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 'lot-1',
            field_id: 'field-1',
            name: 'Lot A',
            lot_type: 'open_lot',
            crop_rotation_plan: 'monoculture',
            light_profile: 'full_sun',
            shape_polygon: {
              type: 'Polygon',
              coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
            },
            weather_alerts_enabled: true,
            notes: null,
            status: 'active',
            fields: { name: 'North Field', status: 'active' },
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          },
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const lots = await listLots('token');
    expect(lots).toEqual([
      {
        id: 'lot-1',
        fieldId: 'field-1',
        name: 'Lot A',
        lotType: 'open_lot',
        cropRotationPlan: 'monoculture',
        lightProfile: 'full_sun',
        shapePolygon: {
          type: 'Polygon',
          coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
        },
        weatherAlertsEnabled: true,
        notes: null,
        status: 'active',
        fieldName: 'North Field',
        fieldStatus: 'active',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
    ]);
  });

  it('builds lot create request payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 'lot-2',
          field_id: 'field-1',
          name: 'Lot B',
          lot_type: 'open_lot',
          crop_rotation_plan: 'monoculture',
          light_profile: 'full_sun',
          shape_polygon: {
            type: 'Polygon',
            coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
          },
          weather_alerts_enabled: false,
          status: 'active',
          created_at: '2026-03-02T00:00:00.000Z',
          updated_at: '2026-03-02T00:00:00.000Z',
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createLot('token', {
      field_id: 'field-1',
      name: 'Lot B',
      lot_type: 'open_lot',
      crop_rotation_plan: 'monoculture',
      light_profile: 'full_sun',
      shape_polygon: {
        type: 'Polygon',
        coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
      },
      notes: null,
    });

    const [url, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Record<string, string>;
    const body = JSON.parse(options.body as string) as Record<string, string>;

    expect(url).toBe('http://127.0.0.1:3300/api/v1/lots');
    expect(options.method).toBe('POST');
    expect(headers.Authorization).toBe('Bearer token');
    expect(headers['Idempotency-Key']).toEqual(expect.stringMatching(/^lots-create-/));
    expect(body).toMatchObject({
      field_id: 'field-1',
      name: 'Lot B',
      lot_type: 'open_lot',
      crop_rotation_plan: 'monoculture',
      light_profile: 'full_sun',
      shape_polygon: {
        type: 'Polygon',
        coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
      },
      notes: null,
    });
  });

  it('parses nested reactivate response payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          [
            {
              id: 'lot-3',
              field_id: 'field-1',
              name: 'Lot C',
              lot_type: 'open_lot',
              crop_rotation_plan: 'monoculture',
              light_profile: 'full_sun',
              status: 'active',
              created_at: '2026-03-02T00:00:00.000Z',
              updated_at: '2026-03-02T00:00:00.000Z',
            },
          ],
          1,
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const lot = await reactivateLot('token', 'lot-3');
    expect(lot.id).toBe('lot-3');
    expect(lot.status).toBe('active');
  });
});
