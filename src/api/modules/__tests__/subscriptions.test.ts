import {
  extractMenuKeys,
  normalizeMenuAccessKey,
  type MenuAccessSnapshot,
} from '../subscriptions';

describe('normalizeMenuAccessKey', () => {
  it('normalizes casing, whitespace, separators, and slashes', () => {
    expect(normalizeMenuAccessKey('  /Dashboard_Main/  ')).toBe('dashboard-main');
  });

  it('preserves wildcard key', () => {
    expect(normalizeMenuAccessKey('*')).toBe('*');
  });

  it('returns null for empty values', () => {
    expect(normalizeMenuAccessKey('   ')).toBeNull();
  });
});

describe('extractMenuKeys', () => {
  it('extracts normalized keys from known menu payload fields', () => {
    const snapshot = [
      {
        menu_name: 'Dashboard',
        menu_path: '/dashboard',
      },
      {
        menu_name: 'Inventory',
        menu_path: '/inventory/products',
      },
      '*',
    ] as unknown as MenuAccessSnapshot;
    const keys = extractMenuKeys(snapshot);

    expect(keys.has('dashboard')).toBe(true);
    expect(keys.has('inventory')).toBe(true);
    expect(keys.has('products')).toBe(true);
    expect(keys.has('*')).toBe(true);
  });
});
