import { ApiError, normalizeApiError } from '../errors';

describe('normalizeApiError', () => {
  it('extracts envelope fields when present', () => {
    const error = normalizeApiError(
      401,
      {
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Access token has expired',
        details: { source: 'gateway' },
        traceId: 'trace-1',
      },
      'fallback message',
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('AUTH_TOKEN_EXPIRED');
    expect(error.message).toBe('Access token has expired');
    expect(error.details).toEqual({ source: 'gateway' });
    expect(error.traceId).toBe('trace-1');
  });

  it('uses fallback values when payload is not an error envelope', () => {
    const error = normalizeApiError(500, 'server down', 'fallback message', 'trace-2');

    expect(error.status).toBe(500);
    expect(error.message).toBe('fallback message');
    expect(error.code).toBeUndefined();
    expect(error.traceId).toBe('trace-2');
  });
});
