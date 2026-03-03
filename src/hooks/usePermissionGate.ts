import { useAuth } from '../providers/AuthProvider';

const MENU_KEY_ALIASES: Record<string, string[]> = {
  lots: ['fields', 'fields-lots', 'fields-&-lots'],
  inventory: ['products', 'categories', 'taxes', 'warehouses', 'stock-adjustment'],
  livestock: ['animal-housing', 'animal-profile', 'weather'],
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
