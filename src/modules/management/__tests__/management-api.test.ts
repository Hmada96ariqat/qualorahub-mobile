import {
  createManagedContact,
  createManagedNotification,
  createManagedRole,
  getStorefrontSettingsByFarm,
  listManagedContacts,
  listManagedUsers,
  updateStorefrontSettings,
} from '../../../api/modules/management';

const originalFetch = global.fetch;

describe('management api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses user list payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 'profile-1',
            user_id: 'user-1',
            email: 'admin@example.test',
            full_name: 'Admin User',
            nick_name: 'Admin',
            mobile_number: null,
            role_id: 'role-1',
            role: { id: 'role-1', name: 'Admin' },
            status: 'active',
            type: 'regular',
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
          },
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const rows = await listManagedUsers('token');

    expect(rows).toEqual([
      {
        id: 'profile-1',
        userId: 'user-1',
        email: 'admin@example.test',
        fullName: 'Admin User',
        nickName: 'Admin',
        mobileNumber: null,
        status: 'active',
        roleId: 'role-1',
        roleName: 'Admin',
        userType: 'regular',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ]);
  });

  it('parses contacts pagination payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'contact-1',
              name: 'Supplier A',
              type: 'supplier',
              contact_types: ['supplier'],
              status: 'active',
              email: 'supplier@example.test',
              created_at: '2026-03-01T00:00:00.000Z',
              updated_at: '2026-03-01T00:00:00.000Z',
            },
          ],
          total: 27,
          limit: 10,
          offset: 0,
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const page = await listManagedContacts('token', {
      limit: 10,
      offset: 0,
      search: 'supplier',
    });

    expect(page.total).toBe(27);
    expect(page.items[0]).toMatchObject({
      id: 'contact-1',
      name: 'Supplier A',
      type: 'supplier',
      status: 'active',
    });
  });

  it('builds create payloads with idempotency headers', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'role-1',
            name: 'Supervisor',
            status: 'active',
            linked_fields: [],
            permissions: [],
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'contact-2',
            name: 'Supplier B',
            type: 'supplier',
            contact_types: ['supplier'],
            status: 'active',
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
            id: 'notification-1',
            title: 'Task Due',
            message: 'Check task',
            type: 'task_due',
            read_at: null,
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
          }),
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createManagedRole('token', { name: 'Supervisor' });
    await createManagedContact('token', {
      name: 'Supplier B',
      type: 'supplier',
      contact_types: ['supplier'],
    });
    await createManagedNotification('token', {
      title: 'Task Due',
      message: 'Check task',
      type: 'task_due',
    });

    const roleHeaders = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    const contactHeaders = fetchMock.mock.calls[1][1].headers as Record<string, string>;
    const notificationHeaders = fetchMock.mock.calls[2][1].headers as Record<string, string>;

    expect(roleHeaders['Idempotency-Key']).toEqual(expect.stringMatching(/^user-role-create-/));
    expect(contactHeaders['Idempotency-Key']).toEqual(expect.stringMatching(/^contact-create-/));
    expect(notificationHeaders['Idempotency-Key']).toEqual(
      expect.stringMatching(/^notification-create-/),
    );
  });

  it('returns null storefront settings when API responds with null', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'null',
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const settings = await getStorefrontSettingsByFarm('token', 'farm-1');

    expect(settings).toBeNull();
  });

  it('parses storefront update response shape with nested rows', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          [
            {
              id: 'settings-1',
              farm_id: 'farm-1',
              delivery_fee: '1.25',
              include_delivery_fee: true,
              is_active: true,
              created_at: '2026-03-01T00:00:00.000Z',
              updated_at: '2026-03-02T00:00:00.000Z',
            },
          ],
          1,
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const updated = await updateStorefrontSettings('token', 'settings-1', {
      delivery_fee: 1.25,
    });

    expect(updated).toMatchObject({
      id: 'settings-1',
      farmId: 'farm-1',
      deliveryFee: 1.25,
      includeDeliveryFee: true,
      isActive: true,
    });
  });
});
