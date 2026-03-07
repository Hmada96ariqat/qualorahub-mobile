import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';

type ExtractJsonResponse<T> = T extends {
  content: { 'application/json': infer TJson };
}
  ? TJson
  : unknown;

export type SubscriptionSnapshot = ExtractJsonResponse<
  operations['SubscriptionsController_getMySubscription_v1']['responses'][200]
>;
export type EntitlementsSnapshot = ExtractJsonResponse<
  operations['SubscriptionsController_getMyEntitlements_v1']['responses'][200]
>;
export type MenuAccessSnapshot = ExtractJsonResponse<
  operations['SubscriptionsController_getMyMenus_v1']['responses'][200]
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Legacy path aliases — maps old/alternative menu paths to canonical paths.
 * Aligns with the web's menuPath.ts normalization.
 */
const LEGACY_PATH_ALIASES: Record<string, string> = {
  'order-list': 'orders',
  'equipments': 'equipment',
  'production-cycle': 'production-cycles',
  'animal-housing': 'animal-housing-unit',
  'housing-unit': 'animal-housing-unit',
};

/**
 * Normalizes a menu path following the web's canonical path matching approach.
 * Strips query params/hash, lowercases, ensures consistent format.
 */
export function normalizeMenuAccessKey(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed === '*') return '*';

  // Strip query params and hash
  const withoutQuery = trimmed.split(/[?#]/, 1)[0] ?? '';

  // Normalize separators: spaces/underscores to hyphens, collapse slashes
  let normalized = withoutQuery
    .replace(/[\s_]+/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+|\/+$/g, '');

  // Resolve legacy aliases
  if (LEGACY_PATH_ALIASES[normalized]) {
    normalized = LEGACY_PATH_ALIASES[normalized];
  }

  return normalized.length > 0 ? normalized : null;
}

/**
 * Checks if a route path matches a menu path using the web's canonical matching logic.
 * Supports exact match and prefix match (for sub-routes).
 */
export function doesRouteMatchMenu(routePath: string, menuPath: string): boolean {
  const normalizedRoute = normalizeMenuAccessKey(routePath);
  const normalizedMenu = normalizeMenuAccessKey(menuPath);

  if (!normalizedRoute || !normalizedMenu) return false;
  if (normalizedRoute === normalizedMenu) return true;

  // Dashboard is an exact match only
  if (normalizedMenu === 'dashboard') return normalizedRoute === 'dashboard';

  // Sub-route matching: /fields/123 matches /fields
  return normalizedRoute.startsWith(normalizedMenu + '/') || normalizedRoute === normalizedMenu;
}

/**
 * Extracts menu keys from the menus API response using canonical path normalization.
 * Reads specific known fields from menu items (menu_path, menu_name, module_name)
 * rather than scraping all string fields heuristically.
 */
function collectMenuKeys(value: unknown, keys: Set<string>): void {
  if (typeof value === 'string') {
    const normalized = normalizeMenuAccessKey(value);
    if (normalized) keys.add(normalized);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectMenuKeys(item, keys);
    return;
  }

  if (!isRecord(value)) return;

  // Read canonical fields from menu items (matches backend's menu response schema)
  const menuPathCandidates = [
    value.menu_path,
    value.menuPath,
    value.path,
  ];
  for (const candidate of menuPathCandidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      const normalized = normalizeMenuAccessKey(candidate);
      if (normalized) keys.add(normalized);
    }
  }

  // Also read module/menu name fields as they may serve as the key
  const nameCandidates = [
    value.module_name,
    value.moduleName,
    value.menu_name,
    value.menuName,
    value.name,
    value.module,
    value.key,
    value.menuKey,
    value.menu_key,
    value.moduleKey,
    value.module_key,
  ];
  for (const candidate of nameCandidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      const normalized = normalizeMenuAccessKey(candidate);
      if (normalized) keys.add(normalized);
    }
  }

  // Recurse into children/submenus
  const children = value.children ?? value.submenus ?? value.items;
  if (Array.isArray(children)) {
    for (const child of children) collectMenuKeys(child, keys);
  }
}

// TODO(openapi-blocker: QH-OAPI-002): Replace unknown response typing with generated payload contracts.
export async function getMySubscription(token: string): Promise<SubscriptionSnapshot> {
  const { data } = await apiClient.get<SubscriptionSnapshot>('/subscriptions/me', {
    token,
  });
  return data;
}

// TODO(openapi-blocker: QH-OAPI-002): Replace unknown response typing with generated payload contracts.
export async function getMyEntitlements(token: string): Promise<EntitlementsSnapshot> {
  const { data } = await apiClient.get<EntitlementsSnapshot>('/subscriptions/me/entitlements', {
    token,
  });
  return data;
}

// TODO(openapi-blocker: QH-OAPI-002): Replace unknown response typing with generated payload contracts.
export async function getMyMenus(token: string): Promise<MenuAccessSnapshot> {
  const { data } = await apiClient.get<MenuAccessSnapshot>('/subscriptions/me/menus', {
    token,
  });
  return data;
}

// Extracts all accessible menu keys from the menus snapshot using canonical path matching.
export function extractMenuKeys(snapshot: MenuAccessSnapshot | null): Set<string> {
  const keys = new Set<string>();
  collectMenuKeys(snapshot, keys);
  return keys;
}

export const SUBSCRIPTION_RESPONSE_BLOCKER_ID =
  OPENAPI_BLOCKER_IDS.SUBSCRIPTION_RESPONSE_SCHEMAS;
