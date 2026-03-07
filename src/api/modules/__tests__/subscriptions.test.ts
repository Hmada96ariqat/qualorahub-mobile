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

  it('resolves legacy path aliases', () => {
    expect(normalizeMenuAccessKey('order-list')).toBe('orders');
    expect(normalizeMenuAccessKey('equipments')).toBe('equipment');
    expect(normalizeMenuAccessKey('production-cycle')).toBe('production-cycles');
    expect(normalizeMenuAccessKey('animal-housing')).toBe('animal-housing-unit');
    expect(normalizeMenuAccessKey('housing-unit')).toBe('animal-housing-unit');
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
        menu_path: '/inventory',
      },
      {
        menu_name: 'Products',
        menu_path: '/products',
      },
      '*',
    ] as unknown as MenuAccessSnapshot;
    const keys = extractMenuKeys(snapshot);

    expect(keys.has('dashboard')).toBe(true);
    expect(keys.has('inventory')).toBe(true);
    expect(keys.has('products')).toBe(true);
    expect(keys.has('*')).toBe(true);
  });

  it('normalizes menu paths and resolves legacy aliases', () => {
    const snapshot = [
      { menu_path: '/order-list' },
      { menu_name: 'equipments' },
    ] as unknown as MenuAccessSnapshot;
    const keys = extractMenuKeys(snapshot);

    expect(keys.has('orders')).toBe(true);
    expect(keys.has('equipment')).toBe(true);
  });

  it('handles nested children/submenus', () => {
    const snapshot = [
      {
        menu_name: 'Commerce',
        children: [
          { menu_name: 'Products', menu_path: '/products' },
          { menu_name: 'Orders', menu_path: '/orders' },
        ],
      },
    ] as unknown as MenuAccessSnapshot;
    const keys = extractMenuKeys(snapshot);

    expect(keys.has('commerce')).toBe(true);
    expect(keys.has('products')).toBe(true);
    expect(keys.has('orders')).toBe(true);
  });
});
