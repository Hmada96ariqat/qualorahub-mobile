export type ManagementModuleKey = 'users' | 'contacts' | 'notifications';
export type RoleCapability = 'full' | 'read-only' | 'none';
export type AccessState = 'full' | 'read-only' | 'locked-role' | 'locked-subscription';

/**
 * Maps management module keys to their canonical RBAC module names as used
 * by the backend's permission matrix. The web frontend uses these same names
 * in RbacContext.can().
 */
const MANAGEMENT_MODULE_TO_RBAC: Record<ManagementModuleKey, string> = {
  users: 'users',
  contacts: 'contacts',
  notifications: 'dashboard', // Backend maps notifications to Dashboard module
};

type PermissionRecord = Record<string, unknown>;

function isRecord(value: unknown): value is PermissionRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toBool(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false;
}

/**
 * Core RBAC permission checker that mirrors the web's RbacContext.can() function.
 * Searches the RBAC permissions array for a matching module and reads flags.
 *
 * @param permissions - The RBAC permissions array from GET /auth/rbac
 * @param moduleName - Canonical module name (e.g. 'Users', 'Contacts', 'Dashboard')
 * @param action - Optional action flag (e.g. 'view', 'add', 'manage_users')
 * @returns boolean — DENIES by default when no permission record exists
 */
export function can(
  permissions: unknown,
  moduleName: string,
  action?: string,
): boolean {
  if (!Array.isArray(permissions)) return false;

  const normalizedModule = moduleName.trim().toLowerCase();
  if (!normalizedModule) return false;

  for (const entry of permissions) {
    if (!isRecord(entry)) continue;

    // Read module name from the permission record (supports multiple field names)
    const name = readPermissionName(entry);
    if (name !== normalizedModule) continue;

    // Module match found
    if (!action) return true; // has ANY permission for this module

    // Check specific action flag (supports can_view, canView, view, etc.)
    const flagKey = `can_${action}`;
    const camelKey = `can${action.charAt(0).toUpperCase()}${action.slice(1)}`;
    return toBool(entry[flagKey]) || toBool(entry[camelKey]) || toBool(entry[action]);
  }

  // No permission record found for this module — deny by default
  return false;
}

function readPermissionName(record: PermissionRecord): string {
  const candidates = [
    record.module,
    record.module_key,
    record.menu,
    record.menu_key,
    record.resource,
    record.subject,
    record.name,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim().toLowerCase();
    }
  }

  return '';
}

/**
 * Derives role capability from RBAC permissions instead of hard-coded role names.
 * This aligns with the web's RbacContext.can() approach.
 *
 * For backward compatibility, the super_admin/admin role types still get full access
 * (matching the web's behavior where admin bypasses RBAC checks).
 */
export function normalizeRoleCapability(
  rbacPermissions: unknown,
  roleType: string | null | undefined,
  moduleKey: ManagementModuleKey,
): RoleCapability {
  const type = (roleType ?? '').trim().toLowerCase();

  // Admin/super_admin bypass RBAC — matches web behavior
  if (type === 'super_admin' || type === 'admin') {
    return 'full';
  }

  const rbacModule = MANAGEMENT_MODULE_TO_RBAC[moduleKey];

  // Check if user has ANY permission for this module
  const hasAny = can(rbacPermissions, rbacModule);
  if (!hasAny) return 'none';

  // Check if user can write (add, edit, delete, or manage_users for the users module)
  const canWrite =
    can(rbacPermissions, rbacModule, 'add') ||
    can(rbacPermissions, rbacModule, 'edit') ||
    can(rbacPermissions, rbacModule, 'delete') ||
    (moduleKey === 'users' && can(rbacPermissions, rbacModule, 'manage_users'));

  if (canWrite) return 'full';

  // Has view but no write — read-only
  const canView = can(rbacPermissions, rbacModule, 'view');
  if (canView) return 'read-only';

  // Has some permission record but no recognized flags — read-only as safe fallback
  return 'read-only';
}

function readEntitlementsReadOnly(snapshot: unknown): boolean {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return false;
  }

  const record = snapshot as Record<string, unknown>;
  const direct = record.readOnly;
  if (typeof direct === 'boolean') return direct;

  const alt = record.read_only;
  if (typeof alt === 'boolean') return alt;

  const mode = record.expiryMode;
  return typeof mode === 'string' && mode.trim().toLowerCase() === 'read_only';
}

export function resolveAccessState(params: {
  roleName?: string | null | undefined;
  roleType?: string | null | undefined;
  rbacPermissions?: unknown;
  moduleKey: ManagementModuleKey;
  menuAllowed: boolean;
  entitlementsSnapshot: unknown;
}): AccessState {
  // Use roleType if provided, fall back to roleName for backward compatibility
  const roleType = params.roleType ?? params.roleName ?? null;

  const roleCapability = normalizeRoleCapability(
    params.rbacPermissions,
    roleType,
    params.moduleKey,
  );

  if (roleCapability === 'none') {
    return 'locked-role';
  }

  if (!params.menuAllowed) {
    return 'locked-subscription';
  }

  if (roleCapability === 'read-only' || readEntitlementsReadOnly(params.entitlementsSnapshot)) {
    return 'read-only';
  }

  return 'full';
}
