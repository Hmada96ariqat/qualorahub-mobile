import { useMemo } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { resolvePermissionKeys } from './usePermissionGate';

export type CrudAction = 'view' | 'add' | 'edit' | 'delete';
export type ModuleActionPermissions = Record<CrudAction, boolean>;

const DENIED_PERMISSIONS: ModuleActionPermissions = {
  view: false,
  add: false,
  edit: false,
  delete: false,
};

type PermissionRecord = Record<string, unknown>;

type PermissionFlags = {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  matched: boolean;
};

function toBool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
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

function readFlags(record: PermissionRecord): PermissionFlags {
  const canView =
    toBool(record.can_view) ?? toBool(record.canView) ?? toBool(record.view) ?? false;
  const canAdd =
    toBool(record.can_add) ?? toBool(record.canAdd) ?? toBool(record.add) ?? toBool(record.create) ?? false;
  const canEdit =
    toBool(record.can_edit) ?? toBool(record.canEdit) ?? toBool(record.edit) ?? toBool(record.update) ?? false;
  const canDelete =
    toBool(record.can_delete) ?? toBool(record.canDelete) ?? toBool(record.delete) ?? toBool(record.remove) ?? false;

  return {
    canView,
    canAdd,
    canEdit,
    canDelete,
    matched: true,
  };
}

function isRecord(value: unknown): value is PermissionRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deriveFromRbacPermissions(
  permissions: unknown,
  menuKey: string,
): PermissionFlags {
  if (!Array.isArray(permissions)) {
    return {
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
      matched: false,
    };
  }

  const acceptable = new Set(resolvePermissionKeys(menuKey).map((value) => value.toLowerCase()));
  let matched = false;
  const aggregate = {
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  };

  for (const entry of permissions) {
    if (!isRecord(entry)) {
      continue;
    }

    const name = readPermissionName(entry);
    if (!name || !acceptable.has(name)) {
      continue;
    }

    matched = true;
    const flags = readFlags(entry);
    aggregate.canView = aggregate.canView || flags.canView;
    aggregate.canAdd = aggregate.canAdd || flags.canAdd;
    aggregate.canEdit = aggregate.canEdit || flags.canEdit;
    aggregate.canDelete = aggregate.canDelete || flags.canDelete;
  }

  return {
    ...aggregate,
    matched,
  };
}

export function useModuleActionPermissions(menuKey: string) {
  const { accessLoading, accessSnapshot, hasMenuAccess } = useAuth();
  const resolvedMenuKeys = useMemo(() => resolvePermissionKeys(menuKey), [menuKey]);

  return useMemo(() => {
    const menuAllowed = resolvedMenuKeys.some((key) => hasMenuAccess(key));
    if (accessLoading || !menuAllowed) {
      return {
        loading: accessLoading,
        permissions: DENIED_PERMISSIONS,
      };
    }

    const roleType =
      typeof accessSnapshot.rbac?.type === 'string'
        ? accessSnapshot.rbac.type.trim().toLowerCase()
        : '';

    if (roleType === 'super_admin' || roleType === 'admin') {
      return {
        loading: false,
        permissions: {
          view: true,
          add: true,
          edit: true,
          delete: true,
        },
      };
    }

    const derived = deriveFromRbacPermissions(accessSnapshot.rbac?.permissions, menuKey);
    if (!derived.matched) {
      // OpenAPI still emits weak RBAC permission typing; fallback to module-level access.
      return {
        loading: false,
        permissions: {
          view: true,
          add: true,
          edit: true,
          delete: true,
        },
      };
    }

    return {
      loading: false,
      permissions: {
        view: derived.canView,
        add: derived.canAdd,
        edit: derived.canEdit,
        delete: derived.canDelete,
      },
    };
  }, [
    accessLoading,
    accessSnapshot.rbac?.permissions,
    accessSnapshot.rbac?.type,
    hasMenuAccess,
    menuKey,
    resolvedMenuKeys,
  ]);
}
