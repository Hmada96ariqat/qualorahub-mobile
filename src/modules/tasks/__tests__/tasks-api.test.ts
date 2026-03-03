import {
  createTask,
  listTaskActivity,
  listTaskAssetOptions,
  listTaskComments,
  listTasks,
  updateTaskStatus,
} from '../../../api/modules/tasks';

const originalFetch = global.fetch;

describe('tasks api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses tasks list payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 'task-1',
            name: 'Inspect Pump',
            description: 'Check pressure',
            status: 'in_progress',
            priority: 'high',
            due_date: '2026-03-09',
            asset_id: 'asset-1',
            asset_name: 'Main Pump',
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          },
        ]),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const tasks = await listTasks('token');
    expect(tasks).toEqual([
      {
        id: 'task-1',
        title: 'Inspect Pump',
        description: 'Check pressure',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-03-09',
        assetId: 'asset-1',
        assetLabel: 'Main Pump',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
    ]);
  });

  it('builds task create request payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 'task-2',
          title: 'Calibrate Sensor',
          status: 'pending',
          created_at: '2026-03-02T00:00:00.000Z',
          updated_at: '2026-03-02T00:00:00.000Z',
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await createTask('token', {
      title: 'Calibrate Sensor',
      description: 'Use tool A',
      status: 'pending',
      priority: 'medium',
      due_date: '2026-03-10',
      asset_id: 'asset-2',
    });

    const [url, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Record<string, string>;
    const body = JSON.parse(options.body as string) as Record<string, string>;

    expect(url).toBe('http://127.0.0.1:3300/api/v1/tasks');
    expect(options.method).toBe('POST');
    expect(headers.Authorization).toBe('Bearer token');
    expect(headers['Idempotency-Key']).toEqual(expect.stringMatching(/^tasks-create-/));
    expect(body).toMatchObject({
      title: 'Calibrate Sensor',
      description: 'Use tool A',
      status: 'pending',
      priority: 'medium',
      due_date: '2026-03-10',
      asset_id: 'asset-2',
    });
  });

  it('updates task status via patch call', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 'task-3',
          title: 'Irrigation review',
          status: 'completed',
          created_at: '2026-03-02T00:00:00.000Z',
          updated_at: '2026-03-02T00:00:00.000Z',
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const task = await updateTaskStatus('token', 'task-3', 'completed');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:3300/api/v1/tasks/task-3');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body as string)).toEqual({ status: 'completed' });
    expect(task.status).toBe('completed');
  });

  it('parses asset options, comments, and activity payloads', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            fields: [{ id: 'field-1', name: 'North Field' }],
            equipment: [{ id: 'asset-1', name: 'Main Pump' }],
            profiles: [{ user_id: 'user-1', email: 'ops@example.com' }],
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([{ id: 'c1', comment: 'Done', author_name: 'Ops', created_at: '2026-03-02' }]),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              id: 'a1',
              action: 'status_changed',
              timestamp: '2026-03-02T00:00:00.000Z',
              details: { title: 'Calibrate Sensor', status: 'completed' },
            },
          ]),
        headers: { get: () => null },
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const assets = await listTaskAssetOptions('token');
    const comments = await listTaskComments('token', 'task-1');
    const activity = await listTaskActivity('token', 'task-1');

    expect(assets).toEqual([
      { value: 'field-1', label: 'Field: North Field' },
      { value: 'asset-1', label: 'Equipment: Main Pump' },
      { value: 'user-1', label: 'User: ops@example.com' },
    ]);
    expect(comments[0]?.message).toBe('Done');
    expect(activity[0]?.action).toBe('status_changed');
    expect(activity[0]?.message).toBe('Calibrate Sensor • completed');
  });
});
