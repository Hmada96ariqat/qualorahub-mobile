import type { ManagedRole, ManagedUser } from '../../api/modules/management';
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

export type RoleFormValues = {
  name: string;
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

export function toRoleFormValues(role?: ManagedRole | null): RoleFormValues {
  return {
    name: role?.name ?? '',
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
