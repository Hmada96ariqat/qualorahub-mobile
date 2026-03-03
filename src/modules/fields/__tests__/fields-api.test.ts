import { createField, listFields, reactivateField, reactivateFieldMain } from '../../../api/modules/fields';

const originalFetch = global.fetch;

describe('fields api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses field list payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 'field-1',
            name: 'North Field',
            area_hectares: '1.20',
            area_unit: 'hectares',
            status: 'active',
            shape_polygon: {
              type: 'Polygon',
              coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
            },
            location: null,
            soil_type: 'loam',
            notes: null,
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          },
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const fields = await listFields('token');

    expect(fields).toEqual([
      {
        id: 'field-1',
        name: 'North Field',
        areaHectares: '1.20',
        areaUnit: 'hectares',
        status: 'active',
        shapePolygon: {
          type: 'Polygon',
          coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
        },
        location: null,
        soilType: 'loam',
        notes: null,
        soilTypeCategory: null,
        soilTypeOther: null,
        irrigationType: null,
        irrigationTypeOther: null,
        soilConditions: null,
        activeCycleSummary: null,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
    ]);
  });

  it('builds field create request payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 'field-2',
          name: 'South Field',
          area_hectares: '2.40',
          area_unit: 'acres',
          status: 'active',
          shape_polygon: {
            type: 'Polygon',
            coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
          },
          created_at: '2026-03-02T00:00:00.000Z',
          updated_at: '2026-03-02T00:00:00.000Z',
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createField('token', {
      name: 'South Field',
      area_hectares: '2.40',
      area_unit: 'acres',
      shape_polygon: {
        type: 'Polygon',
        coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
      },
      notes: null,
    });

    const [url, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Record<string, string>;
    const body = JSON.parse(options.body as string) as Record<string, string>;

    expect(url).toBe('http://127.0.0.1:3300/api/v1/fields');
    expect(options.method).toBe('POST');
    expect(headers.Authorization).toBe('Bearer token');
    expect(headers['Idempotency-Key']).toEqual(expect.stringMatching(/^fields-create-/));
    expect(body).toMatchObject({
      name: 'South Field',
      area_hectares: 2.4,
      area_unit: 'acres',
      shape_polygon: {
        type: 'Polygon',
        coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
      },
      notes: null,
    });
  });

  it('applies status query filter when listing fields', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await listFields('token', { status: 'active' });
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:3300/api/v1/fields?status=active');
  });

  it('uses main-flow status patch for reactivation', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 'field-4',
          name: 'West Field',
          area_hectares: '1.00',
          area_unit: 'hectares',
          status: 'active',
          created_at: '2026-03-02T00:00:00.000Z',
          updated_at: '2026-03-02T00:00:00.000Z',
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await reactivateFieldMain('token', 'field-4');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:3300/api/v1/fields/field-4');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body as string)).toMatchObject({ status: 'active' });
  });

  it('parses nested reactivate response payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          [
            {
              id: 'field-3',
              name: 'East Field',
              area_hectares: '1.00',
              area_unit: 'hectares',
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

    const field = await reactivateField('token', 'field-3');
    expect(field.id).toBe('field-3');
    expect(field.status).toBe('active');
  });
});
