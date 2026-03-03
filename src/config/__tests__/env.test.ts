import { getNativeLoopbackWarning, resolveApiBaseUrl } from '../env';

describe('resolveApiBaseUrl', () => {
  it('keeps explicit non-loopback host unchanged', () => {
    expect(
      resolveApiBaseUrl('https://api.example.com/api/v1', {
        platform: 'android',
      }),
    ).toBe('https://api.example.com/api/v1');
  });

  it('keeps loopback host on web', () => {
    expect(
      resolveApiBaseUrl('http://127.0.0.1:3300/api/v1', {
        platform: 'web',
      }),
    ).toBe('http://127.0.0.1:3300/api/v1');
  });

  it('rewrites loopback host to expo debug host on native', () => {
    expect(
      resolveApiBaseUrl('http://127.0.0.1:3300/api/v1', {
        platform: 'ios',
        debugHost: '192.168.1.42',
      }),
    ).toBe('http://192.168.1.42:3300/api/v1');
  });

  it('rewrites loopback host to android emulator host when no debug host exists', () => {
    expect(
      resolveApiBaseUrl('http://127.0.0.1:3300/api/v1', {
        platform: 'android',
        debugHost: null,
      }),
    ).toBe('http://10.0.2.2:3300/api/v1');
  });

  it('returns warning for native loopback base URL', () => {
    expect(
      getNativeLoopbackWarning('http://127.0.0.1:3300/api/v1', 'ios', {
        isHostLoopbackContext: false,
      }),
    ).toContain('EXPO_PUBLIC_API_BASE_URL');
  });

  it('does not return warning for non-loopback host', () => {
    expect(
      getNativeLoopbackWarning('http://192.168.1.10:3300/api/v1', 'ios'),
    ).toBeNull();
  });

  it('suppresses warning when running in loopback host/simulator context', () => {
    expect(
      getNativeLoopbackWarning('http://127.0.0.1:3300/api/v1', 'ios', {
        isHostLoopbackContext: true,
      }),
    ).toBeNull();
  });
});
