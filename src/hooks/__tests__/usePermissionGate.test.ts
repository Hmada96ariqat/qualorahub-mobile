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

  it('resolves inventory aliases to inventory sub-menu keys', () => {
    expect(resolvePermissionKeys('inventory')).toEqual([
      'inventory',
      'products',
      'categories',
      'taxes',
      'warehouses',
      'stock-adjustment',
    ]);
  });

  it('resolves livestock aliases to livestock-related sub-menu keys', () => {
    expect(resolvePermissionKeys('livestock')).toEqual([
      'livestock',
      'animal-housing',
      'animal-profile',
      'weather',
    ]);
  });

  it('returns only requested key when no alias exists', () => {
    expect(resolvePermissionKeys('finance')).toEqual(['finance']);
  });

  it('returns empty list for blank key', () => {
    expect(resolvePermissionKeys('   ')).toEqual([]);
  });
});
