import {
  createAnimalHealthCheck,
  createHousingUnit,
  createWeatherAlertRule,
  listAnimals,
  listWeatherAlertRulesByLot,
  updateWeatherAlertRule,
} from '../../../api/modules/livestock';

const originalFetch = global.fetch;

describe('livestock api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses animals list payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 'animal-1',
            name: 'Dairy Cow 1',
            species: 'cattle',
            breed: 'Holstein',
            tag_number: 'C-101',
            health_status: 'healthy',
            active_status: 'active',
            quantity: '3',
            current_housing_unit_id: 'housing-1',
            group_id: 'group-1',
            last_vet_visit: '2026-03-01',
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          },
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const animals = await listAnimals('token');

    expect(animals).toEqual([
      {
        id: 'animal-1',
        name: 'Dairy Cow 1',
        species: 'cattle',
        breed: 'Holstein',
        tagNumber: 'C-101',
        healthStatus: 'healthy',
        activeStatus: 'active',
        quantity: 3,
        currentHousingUnitId: 'housing-1',
        groupId: 'group-1',
        lastVetVisit: '2026-03-01',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
    ]);
  });

  it('builds housing create payload and idempotency header', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 'housing-1',
          barn_name: 'Barn A',
          unit_code: 'A-1',
          field_id: 'field-1',
          capacity: 120,
          current_status: 'active',
          animal_types: ['cattle'],
          shape_polygon: {
            type: 'Polygon',
            coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
          },
          notes: 'Main barn',
          created_at: '2026-03-01T00:00:00.000Z',
          updated_at: '2026-03-01T00:00:00.000Z',
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const unit = await createHousingUnit('token', {
      barn_name: 'Barn A',
      unit_code: 'A-1',
      field_id: 'field-1',
      capacity: 120,
      current_status: 'active',
      animal_types: ['cattle'],
      shape_polygon: {
        type: 'Polygon',
        coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
      },
      notes: 'Main barn',
    });

    const [url, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Record<string, string>;
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(url).toBe('http://127.0.0.1:3300/api/v1/housing-units');
    expect(options.method).toBe('POST');
    expect(headers.Authorization).toBe('Bearer token');
    expect(headers['Idempotency-Key']).toEqual(expect.stringMatching(/^housing-units-create-/));
    expect(body).toMatchObject({
      barn_name: 'Barn A',
      unit_code: 'A-1',
      field_id: 'field-1',
      current_status: 'active',
      shape_polygon: {
        type: 'Polygon',
        coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
      },
      notes: 'Main barn',
    });
    expect(unit.shapePolygon).toEqual({
      type: 'Polygon',
      coordinates: [[[35.91, 31.95], [35.912, 31.951], [35.91, 31.95]]],
    });
  });

  it('includes path id bindings for health checks and parses weather rules', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'health-1',
            animal_id: 'animal-1',
            check_date: '2026-03-02',
            status: 'healthy',
            notes: 'all clear',
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
              id: 'rule-1',
              lot_id: 'lot-1',
              field_id: 'field-1',
              name: 'Heat Alert',
              condition: 'temperature',
              operator: '>=',
              value: 35,
              unit: 'C',
              enabled: true,
              severity: 'high',
              custom_message: 'Check housing ventilation',
              created_at: '2026-03-01T00:00:00.000Z',
              updated_at: '2026-03-01T00:00:00.000Z',
            },
          ]),
        headers: { get: () => null },
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    await createAnimalHealthCheck('token', 'animal-1', {
      check_date: '2026-03-02',
      status: 'healthy',
      notes: 'all clear',
    });
    const rules = await listWeatherAlertRulesByLot('token', 'lot-1');

    const [firstUrl, firstOptions] = fetchMock.mock.calls[0];
    const firstBody = JSON.parse(firstOptions.body as string) as Record<string, unknown>;

    expect(firstUrl).toBe('http://127.0.0.1:3300/api/v1/animal-health-checks');
    expect(firstBody.animal_id).toBe('animal-1');
    expect(firstBody.check_date).toBe('2026-03-02');

    expect(rules).toEqual([
      {
        id: 'rule-1',
        lotId: 'lot-1',
        fieldId: 'field-1',
        name: 'Heat Alert',
        condition: 'temperature',
        operator: '>=',
        value: 35,
        unit: 'C',
        enabled: true,
        severity: 'high',
        customMessage: 'Check housing ventilation',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ]);
  });

  it('builds weather rule create/update payloads', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'rule-2',
            lot_id: 'lot-1',
            field_id: 'field-1',
            name: 'Wind Alert',
            condition: 'wind_speed',
            operator: '>=',
            value: 40,
            unit: 'km/h',
            enabled: true,
            severity: 'medium',
            notify_in_app: true,
            notify_email: false,
            notify_sms: false,
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'rule-2',
            lot_id: 'lot-1',
            field_id: 'field-1',
            name: 'Wind Alert (Updated)',
            condition: 'wind_speed',
            operator: '>=',
            value: 45,
            unit: 'km/h',
            enabled: false,
            severity: 'high',
            notify_in_app: true,
            notify_email: true,
            notify_sms: false,
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createWeatherAlertRule('token', {
      lot_id: 'lot-1',
      field_id: 'field-1',
      name: 'Wind Alert',
      condition: 'wind_speed',
      operator: '>=',
      value: 40,
      unit: 'km/h',
      enabled: true,
      severity: 'medium',
      notify_in_app: true,
      notify_email: false,
      notify_sms: false,
    });

    await updateWeatherAlertRule('token', 'rule-2', {
      name: 'Wind Alert (Updated)',
      value: 45,
      enabled: false,
      severity: 'high',
      notify_in_app: true,
      notify_email: true,
      notify_sms: false,
    });

    const [createUrl, createOptions] = fetchMock.mock.calls[0];
    const [updateUrl, updateOptions] = fetchMock.mock.calls[1];

    expect(createUrl).toBe('http://127.0.0.1:3300/api/v1/weather-alert-rules');
    expect((createOptions.headers as Record<string, string>)['Idempotency-Key']).toEqual(
      expect.stringMatching(/^weather-alert-rules-create-/),
    );
    expect(updateUrl).toBe('http://127.0.0.1:3300/api/v1/weather-alert-rules/rule-2');
    expect(updateOptions.method).toBe('PATCH');
    expect(JSON.parse(updateOptions.body as string)).toMatchObject({
      name: 'Wind Alert (Updated)',
      value: 45,
      enabled: false,
      severity: 'high',
      notify_email: true,
    });
  });
});
