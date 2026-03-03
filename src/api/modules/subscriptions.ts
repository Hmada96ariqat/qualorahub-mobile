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

export function normalizeMenuAccessKey(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed === '*') return '*';

  const withoutQuery = trimmed.split(/[?#]/, 1)[0] ?? '';
  const normalized = withoutQuery
    .replace(/[\s_]+/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+|\/+$/g, '');

  return normalized.length > 0 ? normalized : null;
}

function addMenuKeyVariants(value: string, keys: Set<string>): void {
  const normalized = normalizeMenuAccessKey(value);
  if (!normalized) return;

  keys.add(normalized);
  if (normalized === '*') return;

  const segments = normalized.split('/').filter((segment) => segment.length > 0);
  if (segments.length > 1) {
    keys.add(segments[0]);
    keys.add(segments[segments.length - 1]);
  }
}

function collectMenuKeys(value: unknown, keys: Set<string>): void {
  if (typeof value === 'string') {
    addMenuKeyVariants(value, keys);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectMenuKeys(item, keys);
    return;
  }

  if (!isRecord(value)) return;

  const candidates = [
    value.key,
    value.menuKey,
    value.menu_key,
    value.slug,
    value.path,
    value.menuPath,
    value.menu_path,
    value.name,
    value.menuName,
    value.menu_name,
    value.route,
    value.module,
    value.moduleKey,
    value.module_key,
    value.moduleName,
    value.module_name,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      addMenuKeyVariants(candidate, keys);
    }
  }

  for (const nested of Object.values(value)) {
    if (nested !== value) collectMenuKeys(nested, keys);
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

// TODO(openapi-blocker: QH-OAPI-002): Replace this parser with typed menu snapshot selectors.
export function extractMenuKeys(snapshot: MenuAccessSnapshot | null): Set<string> {
  const keys = new Set<string>();
  collectMenuKeys(snapshot, keys);
  return keys;
}

export const SUBSCRIPTION_RESPONSE_BLOCKER_ID =
  OPENAPI_BLOCKER_IDS.SUBSCRIPTION_RESPONSE_SCHEMAS;
