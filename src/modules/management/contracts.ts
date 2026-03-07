import type { ManagedRole, ManagedRolePermission, ManagedUser } from '../../api/modules/management';
import {
  parseCsvValues,
  toContactFormValues,
  type ContactFormValues,
  CONTACT_STATUS_OPTIONS,
  CONTACT_TYPE_OPTIONS,
} from '../../utils/managed-contacts';
import {
  NOTIFICATION_TYPE_OPTIONS,
  toNotificationFormValues,
  toReadAtNow,
  type NotificationFormValues,
} from '../../utils/managed-notifications';
import {
  resolveAccessState,
  type AccessState,
  type ManagementModuleKey,
  type RoleCapability,
} from '../../utils/management-access';

export {
  CONTACT_STATUS_OPTIONS,
  CONTACT_TYPE_OPTIONS,
  NOTIFICATION_TYPE_OPTIONS,
  parseCsvValues,
  resolveAccessState,
  toContactFormValues,
  toNotificationFormValues,
  toReadAtNow,
};
export type {
  AccessState,
  ContactFormValues,
  ManagementModuleKey,
  NotificationFormValues,
  RoleCapability,
};

export type RolePermissionFormValue = {
  module: string;
  label: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type RoleFormValues = {
  name: string;
  permissions: RolePermissionFormValue[];
};

export type InviteFormValues = {
  email: string;
  fullName: string;
  roleId: string;
  expiresAt: string;
};

export type UserFormValues = {
  fullName: string;
  nickName: string;
  mobileNumber: string;
  roleId: string;
  status: string;
};

/**
 * Canonical list of modules that can have RBAC permissions assigned.
 * Order determines display order in the permission matrix UI.
 */
export const PERMISSION_MODULES: ReadonlyArray<{ key: string; label: string; group: string }> = [
  // Core Farm
  { key: 'dashboard', label: 'Dashboard', group: 'Core' },
  { key: 'fields', label: 'Fields & Lots', group: 'Core' },
  { key: 'tasks', label: 'Tasks', group: 'Core' },
  { key: 'weather', label: 'Weather', group: 'Core' },
  // Livestock
  { key: 'animal-housing-unit', label: 'Animal Housing', group: 'Livestock' },
  { key: 'animal-profile', label: 'Animal Profile', group: 'Livestock' },
  { key: 'stock-count', label: 'Stock Count', group: 'Livestock' },
  // Crops
  { key: 'crops', label: 'Crops', group: 'Crops' },
  { key: 'crop-planning', label: 'Crop Planning', group: 'Crops' },
  { key: 'production-cycles', label: 'Production Cycles', group: 'Crops' },
  // Inventory & Commerce
  { key: 'products', label: 'Products', group: 'Inventory & Commerce' },
  { key: 'categories', label: 'Categories', group: 'Inventory & Commerce' },
  { key: 'warehouses', label: 'Warehouses', group: 'Inventory & Commerce' },
  { key: 'stock-adjustment', label: 'Stock Adjustment', group: 'Inventory & Commerce' },
  { key: 'taxes', label: 'Taxes', group: 'Inventory & Commerce' },
  { key: 'orders', label: 'Orders', group: 'Inventory & Commerce' },
  // Operations
  { key: 'equipment', label: 'Equipment', group: 'Operations' },
  { key: 'finance', label: 'Finance', group: 'Operations' },
  // Management
  { key: 'users', label: 'Users', group: 'Management' },
  { key: 'contacts', label: 'Contacts', group: 'Management' },
  { key: 'notifications', label: 'Notifications', group: 'Management' },
];

function buildDefaultPermissions(existing?: ManagedRolePermission[]): RolePermissionFormValue[] {
  const existingMap = new Map<string, ManagedRolePermission>();
  if (existing) {
    for (const perm of existing) {
      existingMap.set(perm.module.trim().toLowerCase(), perm);
    }
  }

  return PERMISSION_MODULES.map(({ key, label }) => {
    const match = existingMap.get(key);
    return {
      module: key,
      label,
      canView: match?.canView ?? false,
      canAdd: match?.canAdd ?? false,
      canEdit: match?.canEdit ?? false,
      canDelete: match?.canDelete ?? false,
    };
  });
}

export function toRoleFormValues(role?: ManagedRole | null): RoleFormValues {
  return {
    name: role?.name ?? '',
    permissions: buildDefaultPermissions(role?.permissions),
  };
}

export function toInviteFormValues(roleId = ''): InviteFormValues {
  const defaultExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  return {
    email: '',
    fullName: '',
    roleId,
    expiresAt: defaultExpiry,
  };
}

export function toUserFormValues(user?: ManagedUser | null): UserFormValues {
  if (!user) {
    return {
      fullName: '',
      nickName: '',
      mobileNumber: '',
      roleId: '',
      status: 'active',
    };
  }

  return {
    fullName: user.fullName ?? '',
    nickName: user.nickName ?? '',
    mobileNumber: user.mobileNumber ?? '',
    roleId: user.roleId ?? '',
    status: user.status,
  };
}

export function createInviteTokenHash(email: string): string {
  const seed = `${email.trim().toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return seed.replace(/[^a-z0-9-]/gi, '');
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.includes('T') ? value : `${value}T00:00:00.000Z`;
}
