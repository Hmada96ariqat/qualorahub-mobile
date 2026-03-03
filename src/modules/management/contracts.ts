import type {
  ManagedContact,
  ManagedRole,
  ManagedUser,
} from '../../api/modules/management';

export type ManagementTab = 'users' | 'contacts' | 'notifications' | 'access';

export const MANAGEMENT_TABS = [
  { value: 'users', label: 'Users' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'access', label: 'Access' },
] as const;

export const CONTACT_TYPE_OPTIONS = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'customer', label: 'Customer' },
  { value: 'other', label: 'Other' },
] as const;

export const CONTACT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const NOTIFICATION_TYPE_OPTIONS = [
  { value: 'task_assigned', label: 'Task Assigned' },
  { value: 'task_updated', label: 'Task Updated' },
  { value: 'task_status_changed', label: 'Task Status Changed' },
  { value: 'task_commented', label: 'Task Commented' },
  { value: 'task_due', label: 'Task Due' },
  { value: 'weather_alert', label: 'Weather Alert' },
  { value: 'order_received', label: 'Order Received' },
  { value: 'low_stock', label: 'Low Stock' },
] as const;

export type ManagementModuleKey = 'users' | 'contacts' | 'notifications';
export type RoleCapability = 'full' | 'read-only' | 'none';
export type AccessState = 'full' | 'read-only' | 'locked-role' | 'locked-subscription';

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

export type ContactFormValues = {
  name: string;
  type: string;
  contactTypesCsv: string;
  status: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  country: string;
  cityRegion: string;
  taxId: string;
};

export type NotificationFormValues = {
  title: string;
  message: string;
  type: string;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseCsvValues(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

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

export function toContactFormValues(contact?: ManagedContact | null): ContactFormValues {
  if (!contact) {
    return {
      name: '',
      type: 'supplier',
      contactTypesCsv: 'supplier',
      status: 'active',
      email: '',
      phone: '',
      company: '',
      address: '',
      notes: '',
      country: '',
      cityRegion: '',
      taxId: '',
    };
  }

  return {
    name: contact.name,
    type: contact.type ?? 'other',
    contactTypesCsv: contact.contactTypes.join(', '),
    status: contact.status,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    company: contact.company ?? '',
    address: contact.address ?? '',
    notes: contact.notes ?? '',
    country: contact.country ?? '',
    cityRegion: contact.cityRegion ?? '',
    taxId: contact.taxId ?? '',
  };
}

export function toNotificationFormValues(): NotificationFormValues {
  return {
    title: '',
    message: '',
    type: 'task_due',
  };
}

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

export function createInviteTokenHash(email: string): string {
  const seed = `${email.trim().toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return seed.replace(/[^a-z0-9-]/gi, '');
}

export function toReadAtNow(): string {
  return new Date().toISOString();
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return todayIsoDate();
  return value.includes('T') ? value : `${value}T00:00:00.000Z`;
}
