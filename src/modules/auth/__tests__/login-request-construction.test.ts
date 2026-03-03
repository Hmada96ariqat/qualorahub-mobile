import { login } from '../api';

const originalFetch = global.fetch;

describe('auth login request construction', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('builds the expected login request payload and endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          access_token: 'token',
          refresh_token: 'refresh',
          token_type: 'bearer',
          expires_in: 900,
          expires_at: new Date(Date.now() + 900_000).toISOString(),
          user: {
            id: 'u1',
            email: 'masked@example.com',
            role: 'admin',
            type: 'super_admin',
            force_password_reset: false,
          },
        }),
      headers: { get: () => null },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await login({
      email: 'hamda96ariqat@gmail.com',
      password: 'Ahmad@123',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Record<string, string>;
    const body = JSON.parse(options.body as string) as Record<string, string>;

    expect(url).toBe('http://127.0.0.1:3300/api/v1/auth/login');
    expect(options.method).toBe('POST');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Accept).toBe('application/json');
    expect(headers['X-Trace-Id']).toEqual(expect.stringMatching(/^qh_/));
    expect(Object.keys(body).sort()).toEqual(['email', 'password']);
    expect((url as string).includes('/api/v1/api/v1')).toBe(false);
  });
});
