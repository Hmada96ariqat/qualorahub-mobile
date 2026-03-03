import { apiClient } from '../http';
import { trackApiError, trackApiRequest } from '../../../utils/observability';

jest.mock('../../../utils/observability', () => ({
  trackApiRequest: jest.fn(),
  trackApiError: jest.fn(),
}));

const originalFetch = global.fetch;

describe('apiClient', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('adds trace and idempotency headers', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiClient.post('/auth/login', {
      idempotencyKey: 'idem-1',
      body: { email: 'u@example.com', password: 'pw' },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Record<string, string>;
    expect(headers['X-Trace-Id']).toEqual(expect.stringMatching(/^qh_/));
    expect(headers['Idempotency-Key']).toBe('idem-1');
    expect(trackApiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/auth/login',
        status: 200,
      }),
    );
  });

  it('records api error telemetry when request fails', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () =>
        JSON.stringify({
          code: 'INTERNAL_ERROR',
          message: 'boom',
          traceId: 'trace-500',
        }),
      headers: {
        get: () => 'trace-500',
      },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/dashboard/snapshot')).rejects.toThrow('boom');
    expect(trackApiError).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/dashboard/snapshot',
        status: 500,
        traceId: 'trace-500',
        code: 'INTERNAL_ERROR',
        errorMessage: 'boom',
      }),
    );
  });
});
