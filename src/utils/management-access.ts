export type ManagementModuleKey = 'users' | 'contacts' | 'notifications';
export type RoleCapability = 'full' | 'read-only' | 'none';
export type AccessState = 'full' | 'read-only' | 'locked-role' | 'locked-subscription';

export function normalizeRoleCapability(
  roleName: string | null | undefined,
  moduleKey: ManagementModuleKey,
): RoleCapability {
  const role = (roleName ?? '').trim().toLowerCase();

  if (role === 'super_admin' || role === 'admin') {
    return 'full';
  }

  if (role === 'manager') {
    if (moduleKey === 'users') return 'none';
    return 'full';
  }

  if (role === 'operator') {
    if (moduleKey === 'contacts' || moduleKey === 'notifications') return 'full';
    return 'none';
  }

  if (role === 'viewer') {
    if (moduleKey === 'contacts' || moduleKey === 'notifications') {
      return 'read-only';
    }
    return 'none';
  }

  return 'none';
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
  roleName: string | null | undefined;
  moduleKey: ManagementModuleKey;
  menuAllowed: boolean;
  entitlementsSnapshot: unknown;
}): AccessState {
  const roleCapability = normalizeRoleCapability(params.roleName, params.moduleKey);
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
