import { resolvePermissionKeys } from '../usePermissionGate';

describe('usePermissionGate helpers', () => {
  it('resolves lots aliases to fields-based menu keys', () => {
    expect(resolvePermissionKeys('lots')).toEqual([
      'lots',
      'fields',
      'fields-lots',
      'fields-&-lots',
    ]);
  });

  it('returns only requested key when no alias exists', () => {
    expect(resolvePermissionKeys('finance')).toEqual(['finance']);
  });

  it('returns empty list for blank key', () => {
    expect(resolvePermissionKeys('   ')).toEqual([]);
  });
});
