import { useMemo } from 'react';
import { useAuth } from '../providers/AuthProvider';

export type ExpiryMode = 'hard_block' | 'read_only' | 'limited_access' | 'active';

export type SubscriptionGuardState = {
  /** Whether entitlements have loaded */
  loading: boolean;
  /** The current expiry mode */
  expiryMode: ExpiryMode;
  /** Whether the subscription is in hard block (no access at all) */
  isHardBlocked: boolean;
  /** Whether the subscription is in read-only mode (view only, no create/edit/delete) */
  isReadOnly: boolean;
  /** Whether the subscription restricts to specific modules */
  isLimitedAccess: boolean;
  /** The list of modules allowed under limited_access mode */
  allowedModules: string[];
  /** Subscription status (active, expired, canceled, etc.) */
  status: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Hook that inspects the entitlements snapshot and derives the subscription
 * guard state. This mirrors the web's PlanPermissionsContext expiry mode logic.
 */
export function useSubscriptionGuard(): SubscriptionGuardState {
  const { accessLoading, accessSnapshot } = useAuth();

  return useMemo(() => {
    const entitlements = accessSnapshot.entitlements;

    if (accessLoading || !entitlements) {
      return {
        loading: true,
        expiryMode: 'active',
        isHardBlocked: false,
        isReadOnly: false,
        isLimitedAccess: false,
        allowedModules: [],
        status: 'unknown',
      };
    }

    if (!isRecord(entitlements)) {
      return {
        loading: false,
        expiryMode: 'active',
        isHardBlocked: false,
        isReadOnly: false,
        isLimitedAccess: false,
        allowedModules: [],
        status: 'unknown',
      };
    }

    const status = typeof entitlements.status === 'string'
      ? entitlements.status.trim().toLowerCase()
      : 'active';

    const expiryModeRaw = typeof entitlements.expiryMode === 'string'
      ? entitlements.expiryMode.trim().toLowerCase()
      : typeof entitlements.expiry_mode === 'string'
        ? entitlements.expiry_mode.trim().toLowerCase()
        : null;

    const readOnly =
      (typeof entitlements.readOnly === 'boolean' && entitlements.readOnly) ||
      (typeof entitlements.read_only === 'boolean' && entitlements.read_only) ||
      expiryModeRaw === 'read_only';

    const isExpiredOrCanceled = status === 'expired' || status === 'canceled';
    const isHardBlocked = isExpiredOrCanceled && expiryModeRaw === 'hard_block';
    const isLimitedAccess = expiryModeRaw === 'limited_access';

    // Extract allowed modules list
    let allowedModules: string[] = [];
    if (Array.isArray(entitlements.allowedModules)) {
      allowedModules = entitlements.allowedModules
        .filter((m): m is string => typeof m === 'string')
        .map((m) => m.trim().toLowerCase());
    } else if (Array.isArray(entitlements.allowed_modules)) {
      allowedModules = entitlements.allowed_modules
        .filter((m): m is string => typeof m === 'string')
        .map((m) => m.trim().toLowerCase());
    }

    // Check for wildcard access
    const WILDCARDS = new Set(['*', 'full', 'all', 'full access']);
    const hasWildcard = allowedModules.some((m) => WILDCARDS.has(m));

    let expiryMode: ExpiryMode = 'active';
    if (isHardBlocked) {
      expiryMode = 'hard_block';
    } else if (readOnly) {
      expiryMode = 'read_only';
    } else if (isLimitedAccess) {
      expiryMode = 'limited_access';
    }

    return {
      loading: false,
      expiryMode,
      isHardBlocked,
      isReadOnly: readOnly,
      isLimitedAccess: isLimitedAccess && !hasWildcard,
      allowedModules: hasWildcard ? [] : allowedModules,
      status,
    };
  }, [accessLoading, accessSnapshot.entitlements]);
}

/**
 * Checks if a specific module is accessible under the current subscription.
 * Used for limited_access mode where only certain modules are allowed.
 */
export function useModuleSubscriptionAccess(moduleName: string): {
  allowed: boolean;
  loading: boolean;
} {
  const guard = useSubscriptionGuard();

  return useMemo(() => {
    if (guard.loading) return { allowed: false, loading: true };
    if (guard.isHardBlocked) return { allowed: false, loading: false };
    if (!guard.isLimitedAccess) return { allowed: true, loading: false };

    // In limited_access mode, check if the module is in the allowed list
    const normalized = moduleName.trim().toLowerCase();
    const MODULE_ALIASES: Record<string, string[]> = {
      'orders': ['order list'],
      'equipment': ['equipments'],
      'production cycles': ['production cycle'],
      'animal housing unit': ['animal housing', 'housing unit'],
    };

    const allowed =
      guard.allowedModules.includes(normalized) ||
      (MODULE_ALIASES[normalized] ?? []).some((alias) =>
        guard.allowedModules.includes(alias),
      );

    return { allowed, loading: false };
  }, [guard, moduleName]);
}
