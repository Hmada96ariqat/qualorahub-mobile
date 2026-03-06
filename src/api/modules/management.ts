import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import {
  isRecord,
  normalizeRows,
  readArray,
  readBoolean,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';

type JsonResponse<
  TOperation extends keyof operations,
  TStatus extends keyof operations[TOperation]['responses'],
> = operations[TOperation]['responses'][TStatus] extends {
  content: { 'application/json': infer TPayload };
}
  ? TPayload
  : unknown;

export type ManagedUser = {
  id: string;
  userId: string | null;
  email: string;
  fullName: string | null;
  nickName: string | null;
  mobileNumber: string | null;
  status: string;
  roleId: string | null;
  roleName: string | null;
  userType: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManagedRolePermission = {
  id: string | null;
  module: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type ManagedRole = {
  id: string;
  name: string;
  status: string;
  description: string | null;
  linkedFields: string[];
  permissions: ManagedRolePermission[];
  createdAt: string;
  updatedAt: string;
};

export type ManagedRoleOption = {
  id: string;
  name: string;
};

export type ManagedInvite = {
  id: string;
  email: string;
  status: string;
  fullName: string | null;
  roleId: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type ManagedContact = {
  id: string;
  name: string;
  type: string | null;
  contactTypes: string[];
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  country: string | null;
  cityRegion: string | null;
  taxId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ManagedContactsPage = {
  items: ManagedContact[];
  total: number;
  limit: number;
  offset: number;
};

export type ManagedNotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'task_status_changed'
  | 'task_commented'
  | 'task_due'
  | 'weather_alert'
  | 'order_received'
  | 'low_stock';

export type ManagedNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  entityType: string | null;
  entityId: string | null;
  dedupeKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FarmStorefrontContext = {
  farmId: string;
  farmName: string;
  previewDeliveryFee: number | null;
  previewShareToken: string | null;
  hasSettings: boolean;
};

export type StorefrontSettingsRecord = {
  id: string;
  farmId: string | null;
  shareToken: string | null;
  deliveryFee: number | null;
  includeDeliveryFee: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateManagedRoleRequest = {
  name: string;
};

export type UpdateManagedRoleRequest = {
  name: string;
};

export type CreateManagedInviteRequest = {
  email: string;
  token_hash: string;
  expires_at: string;
  full_name: string;
  role_id: string;
  nick_name?: string;
  mobile_number?: string | null;
};

export type UpdateManagedUserRequest = {
  full_name?: string;
  nick_name?: string;
  mobile_number?: string | null;
  status?: string;
  role_id?: string;
  attachments?: unknown[];
};

export type CreateManagedContactRequest = {
  name: string;
  type: string;
  contact_types: string[];
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  country?: string;
  city_region?: string;
  tax_id?: string;
  status?: string;
};

export type UpdateManagedContactRequest = Partial<CreateManagedContactRequest>;

export type CreateStorefrontSettingsRequest = {
  farm_id: string;
  delivery_fee?: number;
  include_delivery_fee?: boolean;
  is_active?: boolean;
};

export type UpdateStorefrontSettingsRequest = {
  delivery_fee?: number;
  include_delivery_fee?: boolean;
  is_active?: boolean;
};

export type CreateManagedNotificationRequest = {
  title: string;
  message: string;
  type: ManagedNotificationType;
};

export type UpdateManagedNotificationRequest = {
  read_at: string;
};

type ListUsersResponse = JsonResponse<'UserManagementController_listUsers_v1', 200>;
type UpdateUserResponse = JsonResponse<'UserManagementController_updateUserById_v1', 200>;
type ListRolesResponse = JsonResponse<'UserManagementController_listRoles_v1', 200>;
type CreateRoleResponse = JsonResponse<'UserManagementController_createRole_v1', 201>;
type UpdateRoleResponse = JsonResponse<'UserManagementController_updateRoleById_v1', 200>;
type ListRoleOptionsResponse = JsonResponse<'UserManagementController_listRoleOptions_v1', 200>;
type ListInvitesResponse = JsonResponse<'UserManagementController_listInvites_v1', 200>;
type CreateInviteResponse = JsonResponse<'UserManagementController_createInvite_v1', 201>;
type ListContactsResponse = JsonResponse<'CatalogReadController_getContacts_v1', 200>;
type CreateContactResponse = JsonResponse<'CatalogWriteController_createContact_v1', 201>;
type UpdateContactResponse = JsonResponse<'CatalogWriteController_updateContact_v1', 200>;
type FarmStorefrontResponse = JsonResponse<
  'IntegrationsStorefrontController_getFarmWithStorefrontSettings_v1',
  200
>;
type GetStorefrontSettingsResponse = JsonResponse<
  'IntegrationsStorefrontController_getStorefrontSettingsByFarmId_v1',
  200
>;
type CreateStorefrontSettingsResponse = JsonResponse<
  'IntegrationsStorefrontController_createStorefrontSettings_v1',
  201
>;
type UpdateStorefrontSettingsResponse = JsonResponse<
  'IntegrationsStorefrontController_updateStorefrontSettingsById_v1',
  200
>;
type ListNotificationsResponse = JsonResponse<'OrderWriteController_listNotifications_v1', 200>;
type CreateNotificationResponse = JsonResponse<'OrderWriteController_createNotification_v1', 200>;
type UpdateNotificationResponse = JsonResponse<'OrderWriteController_updateNotification_v1', 200>;

function idempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readFirstString(record: UnknownRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = readString(record, key);
    if (value.length > 0) return value;
  }
  return fallback;
}

function readFirstNullableString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = readNullableString(record, key);
    if (value !== null) return value;
  }
  return null;
}

function readNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readFirstNumber(record: UnknownRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    if (!(key in record)) continue;
    const parsed = readNullableNumber(record[key]);
    if (parsed !== null) return parsed;
  }

  return fallback;
}

function parseList<T>(payload: unknown, parser: (value: unknown) => T | null): T[] {
  return normalizeRows(payload)
    .map((value) => parser(value))
    .filter((value): value is T => value !== null);
}

function parseFirst<T>(payload: unknown, parser: (value: unknown) => T | null, errorText: string): T {
  const rows = parseList(payload, parser);
  if (rows.length === 0) {
    throw new Error(errorText);
  }
  return rows[0];
}

function parseManagedUser(payload: unknown): ManagedUser | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  const role = isRecord(payload.role) ? payload.role : null;
  const roleId = readFirstNullableString(payload, ['role_id']) ?? readNullableString(role ?? {}, 'id');
  const roleName = readNullableString(role ?? {}, 'name');

  return {
    id,
    userId: readFirstNullableString(payload, ['user_id']),
    email: readFirstString(payload, ['email'], 'unknown@example.test'),
    fullName: readFirstNullableString(payload, ['full_name', 'display_name']),
    nickName: readFirstNullableString(payload, ['nick_name']),
    mobileNumber: readFirstNullableString(payload, ['mobile_number']),
    status: readFirstString(payload, ['status'], 'active'),
    roleId,
    roleName,
    userType: readFirstNullableString(payload, ['type']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseManagedRolePermission(payload: unknown): ManagedRolePermission | null {
  if (!isRecord(payload)) return null;

  return {
    id: readFirstNullableString(payload, ['id']),
    module: readFirstString(payload, ['module'], 'Unknown'),
    canView: readBoolean(payload, 'can_view', false),
    canAdd: readBoolean(payload, 'can_add', false),
    canEdit: readBoolean(payload, 'can_edit', false),
    canDelete: readBoolean(payload, 'can_delete', false),
  };
}

function parseManagedRole(payload: unknown): ManagedRole | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  const linkedFields = readArray(payload, 'linked_fields').filter(
    (value): value is string => typeof value === 'string',
  );
  const permissions = parseList(payload.permissions, parseManagedRolePermission);

  return {
    id,
    name: readFirstString(payload, ['name'], 'Role'),
    status: readFirstString(payload, ['status'], 'active'),
    description: readFirstNullableString(payload, ['description']),
    linkedFields,
    permissions,
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseManagedRoleOption(payload: unknown): ManagedRoleOption | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readFirstString(payload, ['name'], 'Role'),
  };
}

function parseManagedInvite(payload: unknown): ManagedInvite | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    email: readFirstString(payload, ['email']),
    status: readFirstString(payload, ['status'], 'pending'),
    fullName: readFirstNullableString(payload, ['full_name']),
    roleId: readFirstNullableString(payload, ['role_id']),
    expiresAt: readFirstNullableString(payload, ['expires_at']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
  };
}

function parseManagedContact(payload: unknown): ManagedContact | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  const contactTypes = readArray(payload, 'contact_types').filter(
    (value): value is string => typeof value === 'string',
  );

  return {
    id,
    name: readFirstString(payload, ['name'], 'Contact'),
    type: readFirstNullableString(payload, ['type']),
    contactTypes,
    company: readFirstNullableString(payload, ['company']),
    phone: readFirstNullableString(payload, ['phone']),
    email: readFirstNullableString(payload, ['email']),
    address: readFirstNullableString(payload, ['address']),
    notes: readFirstNullableString(payload, ['notes']),
    country: readFirstNullableString(payload, ['country']),
    cityRegion: readFirstNullableString(payload, ['city_region']),
    taxId: readFirstNullableString(payload, ['tax_id']),
    status: readFirstString(payload, ['status'], 'active'),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseManagedContactsPage(payload: unknown): ManagedContactsPage {
  if (isRecord(payload)) {
    const items = parseList(payload.items, parseManagedContact);
    return {
      items,
      total: readFirstNumber(payload, ['total'], items.length),
      limit: readFirstNumber(payload, ['limit'], items.length),
      offset: readFirstNumber(payload, ['offset'], 0),
    };
  }

  const items = parseList(payload, parseManagedContact);
  return {
    items,
    total: items.length,
    limit: items.length,
    offset: 0,
  };
}

function parseManagedNotification(payload: unknown): ManagedNotification | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    type: readFirstString(payload, ['type'], 'unknown'),
    title: readFirstString(payload, ['title'], 'Notification'),
    message: readFirstString(payload, ['message']),
    readAt: readFirstNullableString(payload, ['read_at']),
    entityType: readFirstNullableString(payload, ['entity_type']),
    entityId: readFirstNullableString(payload, ['entity_id']),
    dedupeKey: readFirstNullableString(payload, ['dedupe_key']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseFarmStorefrontContext(payload: unknown): FarmStorefrontContext {
  if (!isRecord(payload)) {
    throw new Error('Farm storefront response is invalid.');
  }

  const settingsRows = normalizeRows(payload.storefront_settings);
  const preview =
    settingsRows.length > 0 && isRecord(settingsRows[0]) ? (settingsRows[0] as UnknownRecord) : null;

  return {
    farmId: readFirstString(payload, ['id']),
    farmName: readFirstString(payload, ['name'], 'Farm'),
    previewDeliveryFee: preview ? readNullableNumber(preview.delivery_fee) : null,
    previewShareToken: preview ? readNullableString(preview, 'share_token') : null,
    hasSettings: Boolean(preview),
  };
}

function parseStorefrontSettings(payload: unknown): StorefrontSettingsRecord | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    farmId: readFirstNullableString(payload, ['farm_id']),
    shareToken: readFirstNullableString(payload, ['share_token']),
    deliveryFee: readNullableNumber(payload.delivery_fee),
    includeDeliveryFee: readBoolean(payload, 'include_delivery_fee', true),
    isActive: readBoolean(payload, 'is_active', true),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function toQuery(params: Record<string, string | number | string[] | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      query.set(key, value.join(','));
      continue;
    }
    query.set(key, String(value));
  }
  return query.toString();
}

export async function listManagedUsers(token: string): Promise<ManagedUser[]> {
  const { data } = await apiClient.get<ListUsersResponse>('/user-management/users', { token });
  return parseList(data, parseManagedUser);
}

export async function updateManagedUser(
  token: string,
  profileId: string,
  input: UpdateManagedUserRequest,
): Promise<ManagedUser> {
  const { data } = await apiClient.patch<UpdateUserResponse, UpdateManagedUserRequest>(
    `/user-management/users/${profileId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(
    data,
    parseManagedUser,
    'User update did not return a valid profile payload.',
  );
}

export async function listManagedRoles(token: string): Promise<ManagedRole[]> {
  const { data } = await apiClient.get<ListRolesResponse>('/user-management/roles', { token });
  return parseList(data, parseManagedRole);
}

export async function createManagedRole(
  token: string,
  input: CreateManagedRoleRequest,
): Promise<ManagedRole> {
  const { data } = await apiClient.post<CreateRoleResponse, CreateManagedRoleRequest>(
    '/user-management/roles',
    {
      token,
      body: input,
      idempotencyKey: idempotencyKey('user-role-create'),
    },
  );

  return parseFirst(data, parseManagedRole, 'Role creation did not return a valid role payload.');
}

export async function updateManagedRole(
  token: string,
  roleId: string,
  input: UpdateManagedRoleRequest,
): Promise<ManagedRole> {
  const { data } = await apiClient.patch<UpdateRoleResponse, UpdateManagedRoleRequest>(
    `/user-management/roles/${roleId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseManagedRole, 'Role update did not return a valid role payload.');
}

export async function deleteManagedRole(token: string, roleId: string): Promise<boolean> {
  await apiClient.delete<unknown>(`/user-management/roles/${roleId}`, { token });
  return true;
}

export async function listManagedRoleOptions(token: string): Promise<ManagedRoleOption[]> {
  const { data } = await apiClient.get<ListRoleOptionsResponse>('/user-management/roles/options', {
    token,
  });
  return parseList(data, parseManagedRoleOption);
}

export async function listManagedInvites(token: string): Promise<ManagedInvite[]> {
  const { data } = await apiClient.get<ListInvitesResponse>('/user-management/invites', { token });
  return parseList(data, parseManagedInvite);
}

export async function createManagedInvite(
  token: string,
  input: CreateManagedInviteRequest,
): Promise<ManagedInvite> {
  const { data } = await apiClient.post<CreateInviteResponse, CreateManagedInviteRequest>(
    '/user-management/invites',
    {
      token,
      body: input,
      idempotencyKey: idempotencyKey('user-invite-create'),
    },
  );

  return parseFirst(
    data,
    parseManagedInvite,
    'Invite creation did not return a valid invite payload.',
  );
}

export async function deleteManagedInvite(token: string, inviteId: string): Promise<boolean> {
  await apiClient.delete<unknown>(`/user-management/invites/${inviteId}`, { token });
  return true;
}

export async function listManagedContacts(
  token: string,
  params: {
    limit: number;
    offset: number;
    search?: string;
    status?: string[];
    contactTypes?: string[];
    country?: string;
    cityRegion?: string;
  },
): Promise<ManagedContactsPage> {
  const query = toQuery({
    limit: params.limit,
    offset: params.offset,
    search: params.search && params.search.trim().length > 0 ? params.search.trim() : undefined,
    status: params.status?.length ? params.status : undefined,
    contactTypes: params.contactTypes?.length ? params.contactTypes : undefined,
    country: params.country?.trim() ? params.country.trim() : undefined,
    cityRegion: params.cityRegion?.trim() ? params.cityRegion.trim() : undefined,
  });

  const { data } = await apiClient.get<ListContactsResponse>(`/contacts?${query}`, { token });
  return parseManagedContactsPage(data);
}

export async function createManagedContact(
  token: string,
  input: CreateManagedContactRequest,
): Promise<ManagedContact> {
  const { data } = await apiClient.post<CreateContactResponse, CreateManagedContactRequest>(
    '/contacts',
    {
      token,
      body: input,
      idempotencyKey: idempotencyKey('contact-create'),
    },
  );

  return parseFirst(data, parseManagedContact, 'Contact create did not return a valid payload.');
}

export async function updateManagedContact(
  token: string,
  contactId: string,
  input: UpdateManagedContactRequest,
): Promise<ManagedContact> {
  const { data } = await apiClient.patch<UpdateContactResponse, UpdateManagedContactRequest>(
    `/contacts/${contactId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseManagedContact, 'Contact update did not return a valid payload.');
}

export async function getFarmStorefrontContext(token: string): Promise<FarmStorefrontContext> {
  const { data } = await apiClient.get<FarmStorefrontResponse>('/integrations/storefront/settings/farm', {
    token,
  });
  return parseFarmStorefrontContext(data);
}

export async function getStorefrontSettingsByFarm(
  token: string,
  farmId: string,
): Promise<StorefrontSettingsRecord | null> {
  const path = `/integrations/storefront/settings?farmId=${encodeURIComponent(farmId)}`;
  const { data } = await apiClient.get<GetStorefrontSettingsResponse>(path, {
    token,
  });

  if (data === null || data === undefined) {
    return null;
  }

  const rows = parseList(data, parseStorefrontSettings);
  return rows[0] ?? null;
}

export async function createStorefrontSettings(
  token: string,
  input: CreateStorefrontSettingsRequest,
): Promise<StorefrontSettingsRecord> {
  const { data } = await apiClient.post<CreateStorefrontSettingsResponse, CreateStorefrontSettingsRequest>(
    '/integrations/storefront/settings',
    {
      token,
      body: input,
      idempotencyKey: idempotencyKey('storefront-settings-create'),
    },
  );

  return parseFirst(
    data,
    parseStorefrontSettings,
    'Storefront settings create did not return a valid payload.',
  );
}

export async function updateStorefrontSettings(
  token: string,
  settingsId: string,
  input: UpdateStorefrontSettingsRequest,
): Promise<StorefrontSettingsRecord> {
  const { data } = await apiClient.patch<
    UpdateStorefrontSettingsResponse,
    UpdateStorefrontSettingsRequest
  >(`/integrations/storefront/settings/${settingsId}`, {
    token,
    body: input,
  });

  return parseFirst(
    data,
    parseStorefrontSettings,
    'Storefront settings update did not return a valid payload.',
  );
}

export async function listManagedNotifications(token: string): Promise<ManagedNotification[]> {
  const { data } = await apiClient.get<ListNotificationsResponse>('/notifications', { token });
  return parseList(data, parseManagedNotification);
}

export async function createManagedNotification(
  token: string,
  input: CreateManagedNotificationRequest,
): Promise<ManagedNotification> {
  const { data } = await apiClient.post<CreateNotificationResponse, CreateManagedNotificationRequest>(
    '/notifications',
    {
      token,
      body: input,
      idempotencyKey: idempotencyKey('notification-create'),
    },
  );

  return parseFirst(
    data,
    parseManagedNotification,
    'Notification create did not return a valid payload.',
  );
}

export async function updateManagedNotification(
  token: string,
  notificationId: string,
  input: UpdateManagedNotificationRequest,
): Promise<ManagedNotification> {
  const { data } = await apiClient.patch<UpdateNotificationResponse, UpdateManagedNotificationRequest>(
    `/notifications/${notificationId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(
    data,
    parseManagedNotification,
    'Notification update did not return a valid payload.',
  );
}

export async function deleteManagedNotification(token: string, notificationId: string): Promise<boolean> {
  await apiClient.delete<unknown>(`/notifications/${notificationId}`, { token });
  return true;
}
