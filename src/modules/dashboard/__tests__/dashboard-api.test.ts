import { getDashboardSnapshot } from '../../../api/modules/dashboard';

const originalFetch = global.fetch;

describe('dashboard api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses dashboard snapshot totals and status splits', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          fields: [{ status: 'active' }, { status: 'inactive' }, { status: 'active' }],
          lots: [{ status: 'active' }, { status: 'inactive' }],
          crops: [{}, {}],
          products: [{}, {}, {}],
          productInventory: [{}, {}],
          equipment: [{}],
          tasks: [{}, {}, {}],
          contacts: [{}, {}],
          orders: [{}],
          productionCycles: [{}, {}],
          lowStockAlerts: [{}, {}],
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const snapshot = await getDashboardSnapshot('token');

    expect(snapshot.fieldsTotal).toBe(3);
    expect(snapshot.fieldsActive).toBe(2);
    expect(snapshot.fieldsInactive).toBe(1);
    expect(snapshot.lotsTotal).toBe(2);
    expect(snapshot.lotsActive).toBe(1);
    expect(snapshot.lotsInactive).toBe(1);
    expect(snapshot.ordersTotal).toBe(1);
    expect(snapshot.lowStockAlertsTotal).toBe(2);
    expect(snapshot.fetchedAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
  });
});
