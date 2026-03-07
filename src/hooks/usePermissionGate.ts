import { useAuth } from '../providers/AuthProvider';

/**
 * Module alias registry — maps navigation menu keys to canonical module names
 * as used by the backend. These align with the web's module-registry.ts.
 *
 * The canonical module registry (22 modules):
 *   Dashboard, Fields, Lots, Crop Planning, Production Cycles, Equipment, Tasks,
 *   Finance, Reports, Weather, Animal Housing Unit, Animal Profile, Stock Count,
 *   Products, Categories, Taxes, Orders, Store Dashboard, Storefront,
 *   Warehouses, Stock Adjustment, Contacts, Users, Settings
 */
const MENU_KEY_ALIASES: Record<string, string[]> = {
  lots: ['fields', 'fields-lots', 'fields-&-lots'],
  inventory: ['products', 'categories', 'taxes', 'warehouses', 'stock-adjustment'],
  livestock: ['animal-housing-unit', 'animal-housing', 'animal-profile', 'weather', 'stock-count'],
  crops: ['crop-planning', 'production-cycles'],
};

export function resolvePermissionKeys(menuKey: string): string[] {
  const trimmed = menuKey.trim();
  if (!trimmed) {
    return [];
  }

  const normalized = trimmed.toLowerCase();
  const aliases = MENU_KEY_ALIASES[normalized] ?? [];
  return [trimmed, ...aliases];
}

export function usePermissionGate(menuKey: string) {
  const { accessLoading, hasMenuAccess } = useAuth();
  const keys = resolvePermissionKeys(menuKey);

  return {
    loading: accessLoading,
    allowed: keys.some((key) => hasMenuAccess(key)),
  };
}
