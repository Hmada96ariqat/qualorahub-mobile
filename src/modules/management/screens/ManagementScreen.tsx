import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type {
  ManagedContact,
  ManagedInvite,
  ManagedNotification,
  ManagedRole,
  ManagedUser,
} from '../../../api/modules/management';
import {
  AppBadge,
  AppButton,
  AppHeader,
  AppInput,
  AppListItem,
  AppScreen,
  AppSection,
  AppSelect,
  AppTabs,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  FormField,
  PaginationFooter,
  PullToRefreshContainer,
  SectionCard,
  Skeleton,
  useToast,
} from '../../../components';
import { useAuth } from '../../../providers/AuthProvider';
import { palette, spacing, typography } from '../../../theme/tokens';
import {
  CONTACT_STATUS_OPTIONS,
  CONTACT_TYPE_OPTIONS,
  createInviteTokenHash,
  MANAGEMENT_TABS,
  NOTIFICATION_TYPE_OPTIONS,
  parseCsvValues,
  resolveAccessState,
  toContactFormValues,
  toInviteFormValues,
  toNotificationFormValues,
  toReadAtNow,
  toRoleFormValues,
  toSettingsFormValues,
  toUserFormValues,
  type AccessState,
  type ContactFormValues,
  type InviteFormValues,
  type ManagementModuleKey,
  type ManagementTab,
  type NotificationFormValues,
  type RoleFormValues,
  type SettingsFormValues,
  type UserFormValues,
} from '../contracts';
import { useManagementModule } from '../useManagementModule.hook';

type RoleFormMode = 'create' | 'edit';
type ContactFormMode = 'create' | 'edit';
type ConfirmTarget =
  | { type: 'role-delete'; role: ManagedRole }
  | { type: 'invite-delete'; invite: ManagedInvite }
  | { type: 'notification-delete'; notification: ManagedNotification }
  | { type: 'notification-mark-read'; notification: ManagedNotification };

const CONTACT_PAGE_SIZE = 10;

function makeAccessStateMap(
  roleName: string | null | undefined,
  hasMenuAccess: (menuKey: string) => boolean,
  entitlementsSnapshot: unknown,
): Record<ManagementModuleKey, AccessState> {
  return {
    users: resolveAccessState({
      roleName,
      moduleKey: 'users',
      menuAllowed: hasMenuAccess('users'),
      entitlementsSnapshot,
    }),
    contacts: resolveAccessState({
      roleName,
      moduleKey: 'contacts',
      menuAllowed: hasMenuAccess('contacts'),
      entitlementsSnapshot,
    }),
    settings: resolveAccessState({
      roleName,
      moduleKey: 'settings',
      menuAllowed: hasMenuAccess('settings'),
      entitlementsSnapshot,
    }),
    notifications: resolveAccessState({
      roleName,
      moduleKey: 'notifications',
      menuAllowed: hasMenuAccess('notifications'),
      entitlementsSnapshot,
    }),
  };
}

function isWritable(state: AccessState): boolean {
  return state === 'full';
}

function isVisible(state: AccessState): boolean {
  return state === 'full' || state === 'read-only';
}

function moduleLabel(moduleKey: ManagementModuleKey): string {
  if (moduleKey === 'users') return 'Users';
  if (moduleKey === 'contacts') return 'Contacts';
  if (moduleKey === 'settings') return 'Settings';
  return 'Notifications';
}

function accessBadgeVariant(state: AccessState): 'success' | 'warning' | 'destructive' | 'neutral' {
  if (state === 'full') return 'success';
  if (state === 'read-only') return 'warning';
  if (state === 'locked-subscription') return 'destructive';
  return 'neutral';
}

function accessBadgeLabel(state: AccessState): string {
  if (state === 'full') return 'Full';
  if (state === 'read-only') return 'Read-only';
  if (state === 'locked-subscription') return 'Upgrade required';
  return 'No role access';
}

export function ManagementScreen() {
  const { showToast } = useToast();
  const { accessSnapshot, hasMenuAccess } = useAuth();

  const [tab, setTab] = useState<ManagementTab>('users');
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsSearch, setContactsSearch] = useState('');

  const [roleSheetVisible, setRoleSheetVisible] = useState(false);
  const [roleFormMode, setRoleFormMode] = useState<RoleFormMode>('create');
  const [editingRole, setEditingRole] = useState<ManagedRole | null>(null);
  const [roleFormValues, setRoleFormValues] = useState<RoleFormValues>(toRoleFormValues());

  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
  const [inviteFormValues, setInviteFormValues] = useState<InviteFormValues>(toInviteFormValues());

  const [userSheetVisible, setUserSheetVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userFormValues, setUserFormValues] = useState<UserFormValues>(toUserFormValues());

  const [contactSheetVisible, setContactSheetVisible] = useState(false);
  const [contactFormMode, setContactFormMode] = useState<ContactFormMode>('create');
  const [editingContact, setEditingContact] = useState<ManagedContact | null>(null);
  const [contactFormValues, setContactFormValues] = useState<ContactFormValues>(toContactFormValues());

  const [settingsFormValues, setSettingsFormValues] = useState<SettingsFormValues>(toSettingsFormValues());

  const [notificationSheetVisible, setNotificationSheetVisible] = useState(false);
  const [notificationFormValues, setNotificationFormValues] = useState<NotificationFormValues>(
    toNotificationFormValues(),
  );

  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  const {
    users,
    roles,
    roleOptions,
    invites,
    contactsPage: contactsResult,
    notifications,
    farmStorefront,
    storefrontSettings,
    subscription,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    updateUser,
    createRole,
    updateRole,
    deleteRole,
    createInvite,
    deleteInvite,
    createContact,
    updateContact,
    createStorefrontSettings,
    updateStorefrontSettings,
    createNotification,
    updateNotification,
    deleteNotification,
  } = useManagementModule({
    contactsPage,
    contactsPageSize: CONTACT_PAGE_SIZE,
    contactsSearch,
  });

  const roleName = accessSnapshot.context?.role ?? null;
  const moduleAccessState = useMemo(
    () => makeAccessStateMap(roleName, hasMenuAccess, accessSnapshot.entitlements),
    [roleName, hasMenuAccess, accessSnapshot.entitlements],
  );

  const contactsTotalItems = contactsResult.total;
  const contactsItems = contactsResult.items;
  const settingsId = storefrontSettings?.id ?? null;

  const roleOptionsForSelect = useMemo(
    () => roleOptions.map((item) => ({ value: item.id, label: item.name })),
    [roleOptions],
  );

  const filteredNotifications = useMemo(() => {
    const query = contactsSearch.trim().toLowerCase();
    if (!query) return notifications;
    return notifications.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    });
  }, [notifications, contactsSearch]);

  const canWriteUsers = isWritable(moduleAccessState.users);
  const canWriteContacts = isWritable(moduleAccessState.contacts);
  const canWriteSettings = isWritable(moduleAccessState.settings);
  const canWriteNotifications = isWritable(moduleAccessState.notifications);

  useEffect(() => {
    setSettingsFormValues(toSettingsFormValues(storefrontSettings));
  }, [storefrontSettings]);

  function showNotice(options: {
    title?: string;
    message: string;
    tone?: 'info' | 'success' | 'error';
  }) {
    const prefix = options.title ? `${options.title}: ` : '';
    showToast({
      message: `${prefix}${options.message}`,
      variant: options.tone ?? 'info',
    });
  }

  function resetRoleForm() {
    setRoleFormMode('create');
    setEditingRole(null);
    setRoleFormValues(toRoleFormValues());
  }

  function openCreateRole() {
    resetRoleForm();
    setRoleSheetVisible(true);
  }

  function openEditRole(role: ManagedRole) {
    setRoleFormMode('edit');
    setEditingRole(role);
    setRoleFormValues(toRoleFormValues(role));
    setRoleSheetVisible(true);
  }

  function closeRoleSheet() {
    setRoleSheetVisible(false);
    resetRoleForm();
  }

  function openInviteSheet() {
    const fallbackRole = roleOptions[0]?.id ?? '';
    setInviteFormValues(toInviteFormValues(fallbackRole));
    setInviteSheetVisible(true);
  }

  function closeInviteSheet() {
    setInviteSheetVisible(false);
    setInviteFormValues(toInviteFormValues(roleOptions[0]?.id ?? ''));
  }

  function resetUserForm() {
    setEditingUser(null);
    setUserFormValues(toUserFormValues());
  }

  function openEditUser(user: ManagedUser) {
    setEditingUser(user);
    setUserFormValues(toUserFormValues(user));
    setUserSheetVisible(true);
  }

  function closeUserSheet() {
    setUserSheetVisible(false);
    resetUserForm();
  }

  function resetContactForm() {
    setContactFormMode('create');
    setEditingContact(null);
    setContactFormValues(toContactFormValues());
  }

  function openCreateContact() {
    resetContactForm();
    setContactSheetVisible(true);
  }

  function openEditContact(contact: ManagedContact) {
    setContactFormMode('edit');
    setEditingContact(contact);
    setContactFormValues(toContactFormValues(contact));
    setContactSheetVisible(true);
  }

  function closeContactSheet() {
    setContactSheetVisible(false);
    resetContactForm();
  }

  function openNotificationSheet() {
    setNotificationFormValues(toNotificationFormValues());
    setNotificationSheetVisible(true);
  }

  function closeNotificationSheet() {
    setNotificationSheetVisible(false);
    setNotificationFormValues(toNotificationFormValues());
  }

  async function submitRoleForm() {
    const name = roleFormValues.name.trim();
    if (!name) {
      showNotice({
        title: 'Validation Error',
        message: 'Role name is required.',
      });
      return;
    }

    try {
      if (roleFormMode === 'create') {
        await createRole({ name });
        showNotice({
          title: 'Role Created',
          message: `Role "${name}" was added.`,
          tone: 'success',
        });
      } else if (editingRole) {
        await updateRole(editingRole.id, { name });
        showNotice({
          title: 'Role Updated',
          message: `Role "${name}" was updated.`,
          tone: 'success',
        });
      }

      closeRoleSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save role.';
      showNotice({
        title: 'Save Failed',
        message,
        tone: 'error',
      });
    }
  }

  async function submitInviteForm() {
    const email = inviteFormValues.email.trim().toLowerCase();
    const fullName = inviteFormValues.fullName.trim();
    const roleId = inviteFormValues.roleId.trim();
    const expiresAt = inviteFormValues.expiresAt.trim();

    if (!email || !fullName || !roleId || !expiresAt) {
      showNotice({
        title: 'Validation Error',
        message: 'Email, full name, role, and expiry are required.',
      });
      return;
    }

    try {
      await createInvite({
        email,
        full_name: fullName,
        role_id: roleId,
        expires_at: expiresAt,
        token_hash: createInviteTokenHash(email),
      });
      showNotice({
        title: 'Invite Created',
        message: `Invite created for ${email}.`,
        tone: 'success',
      });
      closeInviteSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create invite.';
      showNotice({
        title: 'Invite Failed',
        message,
        tone: 'error',
      });
    }
  }

  async function submitUserForm() {
    if (!editingUser) {
      showNotice({
        title: 'Save Failed',
        message: 'No user is selected for update.',
        tone: 'error',
      });
      return;
    }

    const payload: Parameters<typeof updateUser>[1] = {};
    const fullName = userFormValues.fullName.trim();
    const nickName = userFormValues.nickName.trim();
    const mobileNumber = userFormValues.mobileNumber.trim();
    const status = userFormValues.status.trim().toLowerCase();
    const roleId = userFormValues.roleId.trim();

    if (fullName.length > 0) {
      payload.full_name = fullName;
    }

    if (nickName.length > 0) {
      payload.nick_name = nickName;
    }

    payload.mobile_number = mobileNumber.length > 0 ? mobileNumber : null;

    if (status.length > 0) {
      payload.status = status;
    }

    if (roleId.length > 0) {
      payload.role_id = roleId;
    }

    if (Object.keys(payload).length === 0) {
      showNotice({
        title: 'Validation Error',
        message: 'At least one updatable user field is required.',
      });
      return;
    }

    try {
      await updateUser(editingUser.id, payload);
      showNotice({
        title: 'User Updated',
        message: editingUser.email,
        tone: 'success',
      });
      closeUserSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user profile.';
      showNotice({
        title: 'Update Failed',
        message,
        tone: 'error',
      });
    }
  }

  async function submitContactForm() {
    const name = contactFormValues.name.trim();
    const type = contactFormValues.type.trim().toLowerCase();
    const contactTypes = parseCsvValues(contactFormValues.contactTypesCsv.toLowerCase());
    if (!name) {
      showNotice({
        title: 'Validation Error',
        message: 'Contact name is required.',
      });
      return;
    }

    if (contactTypes.length === 0) {
      showNotice({
        title: 'Validation Error',
        message: 'At least one contact type is required.',
      });
      return;
    }

    const payload = {
      name,
      type: type || 'other',
      contact_types: contactTypes,
      status: contactFormValues.status.trim().toLowerCase() || 'active',
      email: contactFormValues.email.trim() || undefined,
      phone: contactFormValues.phone.trim() || undefined,
      company: contactFormValues.company.trim() || undefined,
      address: contactFormValues.address.trim() || undefined,
      notes: contactFormValues.notes.trim() || undefined,
      country: contactFormValues.country.trim() || undefined,
      city_region: contactFormValues.cityRegion.trim() || undefined,
      tax_id: contactFormValues.taxId.trim() || undefined,
    };

    try {
      if (contactFormMode === 'create') {
        await createContact(payload);
        showNotice({
          title: 'Contact Created',
          message: `${name} added.`,
          tone: 'success',
        });
      } else if (editingContact) {
        await updateContact(editingContact.id, payload);
        showNotice({
          title: 'Contact Updated',
          message: `${name} updated.`,
          tone: 'success',
        });
      }
      closeContactSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save contact.';
      showNotice({
        title: 'Save Failed',
        message,
        tone: 'error',
      });
    }
  }

  async function saveSettings() {
    if (!farmStorefront) {
      showNotice({
        title: 'Save Failed',
        message: 'Farm settings context is unavailable.',
        tone: 'error',
      });
      return;
    }

    const deliveryFeeValue = settingsFormValues.deliveryFee.trim();
    const deliveryFee = deliveryFeeValue.length > 0 ? Number.parseFloat(deliveryFeeValue) : 0;
    if (!Number.isFinite(deliveryFee)) {
      showNotice({
        title: 'Validation Error',
        message: 'Delivery fee must be a valid number.',
      });
      return;
    }

    try {
      if (!settingsId) {
        await createStorefrontSettings({
          farm_id: farmStorefront.farmId,
          delivery_fee: deliveryFee,
          include_delivery_fee: settingsFormValues.includeDeliveryFee,
          is_active: settingsFormValues.isActive,
        });
        showNotice({
          title: 'Settings Created',
          message: 'Storefront settings were created.',
          tone: 'success',
        });
      } else {
        await updateStorefrontSettings(settingsId, {
          delivery_fee: deliveryFee,
          include_delivery_fee: settingsFormValues.includeDeliveryFee,
          is_active: settingsFormValues.isActive,
        });
        showNotice({
          title: 'Settings Updated',
          message: 'Storefront settings were updated.',
          tone: 'success',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings.';
      showNotice({
        title: 'Save Failed',
        message,
        tone: 'error',
      });
    }
  }

  async function submitNotificationForm() {
    const title = notificationFormValues.title.trim();
    const message = notificationFormValues.message.trim();
    const type = notificationFormValues.type.trim();

    if (!title || !message || !type) {
      showNotice({
        title: 'Validation Error',
        message: 'Notification title, message, and type are required.',
      });
      return;
    }

    try {
      await createNotification({
        title,
        message,
        type: type as (typeof NOTIFICATION_TYPE_OPTIONS)[number]['value'],
      });
      showNotice({
        title: 'Notification Sent',
        message: 'Notification was created.',
        tone: 'success',
      });
      closeNotificationSheet();
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to create notification.';
      showNotice({
        title: 'Create Failed',
        message: messageText,
        tone: 'error',
      });
    }
  }

  async function confirmAction() {
    if (!confirmTarget) return;

    try {
      if (confirmTarget.type === 'role-delete') {
        await deleteRole(confirmTarget.role.id);
        showNotice({
          title: 'Role Deleted',
          message: `${confirmTarget.role.name} removed.`,
          tone: 'success',
        });
      } else if (confirmTarget.type === 'invite-delete') {
        await deleteInvite(confirmTarget.invite.id);
        showNotice({
          title: 'Invite Removed',
          message: confirmTarget.invite.email,
          tone: 'success',
        });
      } else if (confirmTarget.type === 'notification-delete') {
        await deleteNotification(confirmTarget.notification.id);
        showNotice({
          title: 'Notification Deleted',
          message: confirmTarget.notification.title,
          tone: 'success',
        });
      } else if (confirmTarget.type === 'notification-mark-read') {
        await updateNotification(confirmTarget.notification.id, {
          read_at: toReadAtNow(),
        });
        showNotice({
          title: 'Marked as Read',
          message: confirmTarget.notification.title,
          tone: 'success',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed.';
      showNotice({
        title: 'Action Failed',
        message,
        tone: 'error',
      });
    } finally {
      setConfirmTarget(null);
    }
  }

  function renderAccessGuard(moduleKey: ManagementModuleKey) {
    const state = moduleAccessState[moduleKey];
    if (isVisible(state)) return null;

    const title =
      state === 'locked-subscription'
        ? `${moduleLabel(moduleKey)} locked by subscription`
        : `${moduleLabel(moduleKey)} blocked by role`;
    const message =
      state === 'locked-subscription'
        ? 'Current subscription does not include this module. Upgrade to enable it.'
        : 'Your current role does not allow this module.';

    return (
      <EmptyState
        title={title}
        message={message}
        actionLabel={state === 'locked-subscription' ? 'Review Access' : undefined}
        onAction={state === 'locked-subscription' ? () => setTab('access') : undefined}
      />
    );
  }

  function renderAccessBanner(moduleKey: ManagementModuleKey) {
    const state = moduleAccessState[moduleKey];
    if (state !== 'read-only') return null;

    return (
      <SectionCard>
        <EmptyState
          title={`${moduleLabel(moduleKey)} in read-only mode`}
          message="You can view records, but write actions are disabled for your current role or entitlement mode."
        />
      </SectionCard>
    );
  }

  function renderUsersTab() {
    const guard = renderAccessGuard('users');
    if (guard) return guard;

    return (
      <>
        {renderAccessBanner('users')}

        <SectionCard>
          <AppSection
            title="Users"
            description="User profile list from /user-management/users."
          >
            {users.length === 0 ? (
              <EmptyState
                title="No Users"
                message="No user profiles were returned."
              />
            ) : (
              users.map((user) => (
                <View key={user.id} style={styles.listBlock}>
                  <AppListItem
                    title={user.fullName ?? user.email}
                    description={`Role: ${user.roleName ?? 'n/a'} • ${user.email}`}
                    rightText={user.status}
                    onPress={canWriteUsers ? () => openEditUser(user) : undefined}
                  />
                  {canWriteUsers ? (
                    <View style={styles.inlineButtons}>
                      <AppButton
                        label="Edit User"
                        mode="outlined"
                        tone="neutral"
                        onPress={() => openEditUser(user)}
                      />
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </AppSection>
        </SectionCard>

        <SectionCard>
          <AppSection
            title="Roles"
            description="Create, update, and delete roles relevant to mobile operations."
          >
            <View style={styles.rowActions}>
              <AppButton
                label="Create Role"
                onPress={openCreateRole}
                disabled={!canWriteUsers}
              />
            </View>
            {roles.length === 0 ? (
              <EmptyState
                title="No Roles"
                message="No roles were returned."
              />
            ) : (
              roles.map((role) => (
                <View key={role.id} style={styles.listBlock}>
                  <AppListItem
                    title={role.name}
                    description={`${role.permissions.length} permissions`}
                    rightText={role.status}
                    onPress={canWriteUsers ? () => openEditRole(role) : undefined}
                  />
                  {canWriteUsers ? (
                    <View style={styles.inlineButtons}>
                      <AppButton
                        label="Edit"
                        mode="outlined"
                        tone="neutral"
                        onPress={() => openEditRole(role)}
                      />
                      <AppButton
                        label="Delete"
                        mode="outlined"
                        tone="destructive"
                        onPress={() => setConfirmTarget({ type: 'role-delete', role })}
                      />
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </AppSection>
        </SectionCard>

        <SectionCard>
          <AppSection
            title="Invites"
            description="Invite flow using /user-management/invites."
          >
            <View style={styles.rowActions}>
              <AppButton
                label="Create Invite"
                onPress={openInviteSheet}
                disabled={!canWriteUsers}
              />
            </View>
            {invites.length === 0 ? (
              <EmptyState
                title="No Invites"
                message="No invites were returned."
              />
            ) : (
              invites.map((invite) => (
                <View key={invite.id} style={styles.listBlock}>
                  <AppListItem
                    title={invite.fullName ?? invite.email}
                    description={invite.email}
                    rightText={invite.status}
                  />
                  {canWriteUsers ? (
                    <View style={styles.inlineButtons}>
                      <AppButton
                        label="Delete"
                        mode="outlined"
                        tone="destructive"
                        onPress={() => setConfirmTarget({ type: 'invite-delete', invite })}
                      />
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </AppSection>
        </SectionCard>
      </>
    );
  }

  function renderContactsTab() {
    const guard = renderAccessGuard('contacts');
    if (guard) return guard;

    return (
      <>
        {renderAccessBanner('contacts')}

        <SectionCard>
          <AppSection
            title="Contacts"
            description="Contact list with search and paging."
          >
            <FilterBar
              searchValue={contactsSearch}
              onSearchChange={(value) => {
                setContactsSearch(value);
                setContactsPage(1);
              }}
              searchPlaceholder="Search contacts"
            />

            <View style={styles.rowActions}>
              <AppButton
                label="Create Contact"
                onPress={openCreateContact}
                disabled={!canWriteContacts}
              />
            </View>

            {contactsItems.length === 0 ? (
              <EmptyState
                title="No Contacts"
                message="No contacts match the current filters."
              />
            ) : (
              contactsItems.map((contact) => (
                <View key={contact.id} style={styles.listBlock}>
                  <AppListItem
                    title={contact.name}
                    description={`${contact.type ?? 'other'} • ${contact.email ?? 'no email'}`}
                    rightText={contact.status}
                    onPress={canWriteContacts ? () => openEditContact(contact) : undefined}
                  />
                  {canWriteContacts ? (
                    <View style={styles.inlineButtons}>
                      <AppButton
                        label="Edit"
                        mode="outlined"
                        tone="neutral"
                        onPress={() => openEditContact(contact)}
                      />
                    </View>
                  ) : null}
                </View>
              ))
            )}

            <PaginationFooter
              page={contactsPage}
              pageSize={CONTACT_PAGE_SIZE}
              totalItems={contactsTotalItems}
              loading={isRefreshing}
              onPageChange={setContactsPage}
            />
          </AppSection>
        </SectionCard>
      </>
    );
  }

  function renderSettingsTab() {
    const guard = renderAccessGuard('settings');
    if (guard) return guard;

    return (
      <>
        {renderAccessBanner('settings')}

        <SectionCard>
          <AppSection
            title="Farm Storefront Settings"
            description="Essentials from integrations storefront settings APIs."
          >
            <AppListItem
              title={farmStorefront?.farmName ?? 'Farm'}
              description={`Farm ID: ${farmStorefront?.farmId ?? 'n/a'}`}
            />
            <FormField
              label="Delivery Fee"
              helperText="Numeric value sent as delivery_fee"
            >
              <AppInput
                value={settingsFormValues.deliveryFee}
                onChangeText={(value) =>
                  setSettingsFormValues((prev) => ({
                    ...prev,
                    deliveryFee: value,
                  }))
                }
                placeholder="0"
                keyboardType="decimal-pad"
                disabled={!canWriteSettings}
              />
            </FormField>

            <FormField label="Include Delivery Fee">
              <AppSelect
                value={settingsFormValues.includeDeliveryFee ? 'yes' : 'no'}
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
                onChange={(value) =>
                  setSettingsFormValues((prev) => ({
                    ...prev,
                    includeDeliveryFee: value === 'yes',
                  }))
                }
                disabled={!canWriteSettings}
              />
            </FormField>

            <FormField label="Active">
              <AppSelect
                value={settingsFormValues.isActive ? 'active' : 'inactive'}
                options={[...CONTACT_STATUS_OPTIONS]}
                onChange={(value) =>
                  setSettingsFormValues((prev) => ({
                    ...prev,
                    isActive: value === 'active',
                  }))
                }
                disabled={!canWriteSettings}
              />
            </FormField>

            <View style={styles.rowActions}>
              <AppButton
                label={settingsId ? 'Update Settings' : 'Create Settings'}
                onPress={() => void saveSettings()}
                loading={isMutating}
                disabled={!canWriteSettings}
              />
            </View>
          </AppSection>
        </SectionCard>
      </>
    );
  }

  function renderNotificationsTab() {
    const guard = renderAccessGuard('notifications');
    if (guard) return guard;

    return (
      <>
        {renderAccessBanner('notifications')}

        <SectionCard>
          <AppSection
            title="Notifications Center"
            description="In-app notification list with read/update actions."
          >
            <FilterBar
              searchValue={contactsSearch}
              onSearchChange={setContactsSearch}
              searchPlaceholder="Search notifications"
            />

            <View style={styles.rowActions}>
              <AppButton
                label="Create Notification"
                onPress={openNotificationSheet}
                disabled={!canWriteNotifications}
              />
            </View>

            {filteredNotifications.length === 0 ? (
              <EmptyState
                title="No Notifications"
                message="No notifications matched the current filter."
              />
            ) : (
              filteredNotifications.map((notification) => (
                <View key={notification.id} style={styles.listBlock}>
                  <AppListItem
                    title={notification.title}
                    description={`${notification.type} • ${notification.message}`}
                    rightText={notification.readAt ? 'read' : 'unread'}
                  />
                  <View style={styles.inlineButtons}>
                    <AppButton
                      label="Mark Read"
                      mode="outlined"
                      tone="neutral"
                      disabled={!canWriteNotifications || Boolean(notification.readAt)}
                      onPress={() =>
                        setConfirmTarget({
                          type: 'notification-mark-read',
                          notification,
                        })
                      }
                    />
                    <AppButton
                      label="Delete"
                      mode="outlined"
                      tone="destructive"
                      disabled={!canWriteNotifications}
                      onPress={() =>
                        setConfirmTarget({
                          type: 'notification-delete',
                          notification,
                        })
                      }
                    />
                  </View>
                </View>
              ))
            )}
          </AppSection>
        </SectionCard>
      </>
    );
  }

  function renderAccessTab() {
    const entitlement = accessSnapshot.entitlements;
    const menuRows = accessSnapshot.menus;
    const allowedModules =
      entitlement && typeof entitlement === 'object' && !Array.isArray(entitlement)
        ? ((entitlement as Record<string, unknown>).allowedModules as string[] | undefined) ?? []
        : [];
    const readOnly =
      entitlement && typeof entitlement === 'object' && !Array.isArray(entitlement)
        ? Boolean((entitlement as Record<string, unknown>).readOnly)
        : false;

    return (
      <>
        <SectionCard>
          <AppSection
            title="Subscription Snapshot"
            description="Read-only state and plan period from /subscriptions/me."
          >
            <AppListItem
              title="Status"
              description={(subscription as { subscription?: { status?: string } } | null)?.subscription?.status ?? 'n/a'}
            />
            <AppListItem
              title="Read-only mode"
              description={readOnly ? 'Enabled' : 'Disabled'}
            />
            <AppListItem
              title="Allowed module groups"
              description={String(allowedModules.length)}
            />
            <AppListItem
              title="Menu snapshot rows"
              description={
                Array.isArray(menuRows)
                  ? String(menuRows.length)
                  : menuRows && typeof menuRows === 'object'
                    ? String(Object.keys(menuRows).length)
                    : '0'
              }
            />
          </AppSection>
        </SectionCard>

        <SectionCard>
          <AppSection
            title="Module Access States"
            description="Resolved state by role + menu access + entitlement mode."
          >
            {(Object.keys(moduleAccessState) as ManagementModuleKey[]).map((moduleKey) => {
              const state = moduleAccessState[moduleKey];
              return (
                <View key={moduleKey} style={styles.accessRow}>
                  <Text style={styles.accessLabel}>{moduleLabel(moduleKey)}</Text>
                  <AppBadge
                    value={accessBadgeLabel(state)}
                    variant={accessBadgeVariant(state)}
                  />
                </View>
              );
            })}
          </AppSection>
        </SectionCard>
      </>
    );
  }

  function renderTabBody() {
    if (tab === 'users') return renderUsersTab();
    if (tab === 'contacts') return renderContactsTab();
    if (tab === 'settings') return renderSettingsTab();
    if (tab === 'notifications') return renderNotificationsTab();
    return renderAccessTab();
  }

  const roleSheetFooter = (
    <View style={styles.sheetFooter}>
      <AppButton
        label="Cancel"
        mode="text"
        tone="neutral"
        onPress={closeRoleSheet}
      />
      <AppButton
        label={roleFormMode === 'create' ? 'Create Role' : 'Update Role'}
        onPress={() => void submitRoleForm()}
        loading={isMutating}
      />
    </View>
  );

  const userSheetFooter = (
    <View style={styles.sheetFooter}>
      <AppButton
        label="Cancel"
        mode="text"
        tone="neutral"
        onPress={closeUserSheet}
      />
      <AppButton
        label="Update User"
        onPress={() => void submitUserForm()}
        loading={isMutating}
      />
    </View>
  );

  const inviteSheetFooter = (
    <View style={styles.sheetFooter}>
      <AppButton
        label="Cancel"
        mode="text"
        tone="neutral"
        onPress={closeInviteSheet}
      />
      <AppButton
        label="Create Invite"
        onPress={() => void submitInviteForm()}
        loading={isMutating}
      />
    </View>
  );

  const contactSheetFooter = (
    <View style={styles.sheetFooter}>
      <AppButton
        label="Cancel"
        mode="text"
        tone="neutral"
        onPress={closeContactSheet}
      />
      <AppButton
        label={contactFormMode === 'create' ? 'Create Contact' : 'Update Contact'}
        onPress={() => void submitContactForm()}
        loading={isMutating}
      />
    </View>
  );

  const notificationSheetFooter = (
    <View style={styles.sheetFooter}>
      <AppButton
        label="Cancel"
        mode="text"
        tone="neutral"
        onPress={closeNotificationSheet}
      />
      <AppButton
        label="Create Notification"
        onPress={() => void submitNotificationForm()}
        loading={isMutating}
      />
    </View>
  );

  return (
    <AppScreen padded={false}>
      <AppHeader
        title="Management"
        subtitle="Phase 13: users, contacts, settings, notifications, and subscription access."
      />

      <PullToRefreshContainer
        refreshing={isRefreshing}
        onRefresh={() => void refresh()}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topActions}>
          <AppButton
            label="Refresh"
            onPress={() => void refresh()}
            loading={isRefreshing}
          />
        </View>

        <SectionCard>
          <AppSection
            title="Overview"
            description="Phase 13 management surfaces."
          >
            <View style={styles.overviewGrid}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Users</Text>
                <Text style={styles.metricValue}>{users.length}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Roles</Text>
                <Text style={styles.metricValue}>{roles.length}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Contacts</Text>
                <Text style={styles.metricValue}>{contactsResult.total}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Notifications</Text>
                <Text style={styles.metricValue}>{notifications.length}</Text>
              </View>
            </View>
          </AppSection>
        </SectionCard>

        <SectionCard>
          <AppTabs
            value={tab}
            onValueChange={(value) => setTab(value as ManagementTab)}
            tabs={MANAGEMENT_TABS as unknown as { value: string; label: string }[]}
          />
          <View style={styles.tabBody}>
            {isLoading ? (
              <>
                <Skeleton height={20} />
                <Skeleton height={84} />
                <Skeleton height={84} />
              </>
            ) : errorMessage ? (
              <ErrorState
                title="Management Data Failed"
                message={errorMessage}
                onRetry={() => void refresh()}
              />
            ) : (
              renderTabBody()
            )}
          </View>
        </SectionCard>
      </PullToRefreshContainer>

      <BottomSheet
        visible={roleSheetVisible}
        title={roleFormMode === 'create' ? 'Create Role' : 'Update Role'}
        footer={roleSheetFooter}
        onDismiss={closeRoleSheet}
      >
        <FormField label="Role Name">
          <AppInput
            value={roleFormValues.name}
            onChangeText={(value) => setRoleFormValues({ name: value })}
            placeholder="Role name"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={userSheetVisible}
        title="Update User"
        footer={userSheetFooter}
        onDismiss={closeUserSheet}
      >
        <FormField label="Full name">
          <AppInput
            value={userFormValues.fullName}
            onChangeText={(value) =>
              setUserFormValues((prev) => ({
                ...prev,
                fullName: value,
              }))
            }
            placeholder="Full name"
          />
        </FormField>
        <FormField label="Nick name">
          <AppInput
            value={userFormValues.nickName}
            onChangeText={(value) =>
              setUserFormValues((prev) => ({
                ...prev,
                nickName: value,
              }))
            }
            placeholder="Nick name"
          />
        </FormField>
        <FormField label="Mobile number">
          <AppInput
            value={userFormValues.mobileNumber}
            onChangeText={(value) =>
              setUserFormValues((prev) => ({
                ...prev,
                mobileNumber: value,
              }))
            }
            placeholder="+1..."
          />
        </FormField>
        <FormField label="Role">
          <AppSelect
            value={userFormValues.roleId}
            options={roleOptionsForSelect}
            onChange={(value) =>
              setUserFormValues((prev) => ({
                ...prev,
                roleId: value,
              }))
            }
          />
        </FormField>
        <FormField label="Status">
          <AppInput
            value={userFormValues.status}
            onChangeText={(value) =>
              setUserFormValues((prev) => ({
                ...prev,
                status: value,
              }))
            }
            placeholder="active"
            autoCapitalize="none"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={inviteSheetVisible}
        title="Create Invite"
        footer={inviteSheetFooter}
        onDismiss={closeInviteSheet}
      >
        <FormField label="Email">
          <AppInput
            value={inviteFormValues.email}
            onChangeText={(value) =>
              setInviteFormValues((prev) => ({
                ...prev,
                email: value,
              }))
            }
            placeholder="invite@example.test"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FormField>
        <FormField label="Full Name">
          <AppInput
            value={inviteFormValues.fullName}
            onChangeText={(value) =>
              setInviteFormValues((prev) => ({
                ...prev,
                fullName: value,
              }))
            }
            placeholder="Invitee name"
          />
        </FormField>
        <FormField label="Role">
          <AppSelect
            value={inviteFormValues.roleId}
            options={roleOptionsForSelect}
            onChange={(value) =>
              setInviteFormValues((prev) => ({
                ...prev,
                roleId: value,
              }))
            }
          />
        </FormField>
        <FormField label="Expires At (ISO)">
          <AppInput
            value={inviteFormValues.expiresAt}
            onChangeText={(value) =>
              setInviteFormValues((prev) => ({
                ...prev,
                expiresAt: value,
              }))
            }
            placeholder="2026-03-04T00:00:00.000Z"
            autoCapitalize="none"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={contactSheetVisible}
        title={contactFormMode === 'create' ? 'Create Contact' : 'Update Contact'}
        footer={contactSheetFooter}
        onDismiss={closeContactSheet}
      >
        <FormField label="Name">
          <AppInput
            value={contactFormValues.name}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                name: value,
              }))
            }
            placeholder="Contact name"
          />
        </FormField>
        <FormField label="Type">
          <AppSelect
            value={contactFormValues.type}
            options={[...CONTACT_TYPE_OPTIONS]}
            onChange={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                type: value,
              }))
            }
          />
        </FormField>
        <FormField label="Contact Types (CSV)">
          <AppInput
            value={contactFormValues.contactTypesCsv}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                contactTypesCsv: value,
              }))
            }
            placeholder="supplier, customer"
          />
        </FormField>
        <FormField label="Status">
          <AppSelect
            value={contactFormValues.status}
            options={[...CONTACT_STATUS_OPTIONS]}
            onChange={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                status: value,
              }))
            }
          />
        </FormField>
        <FormField label="Email">
          <AppInput
            value={contactFormValues.email}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                email: value,
              }))
            }
            placeholder="name@example.test"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FormField>
        <FormField label="Phone">
          <AppInput
            value={contactFormValues.phone}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                phone: value,
              }))
            }
            placeholder="+1..."
          />
        </FormField>
        <FormField label="Company">
          <AppInput
            value={contactFormValues.company}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                company: value,
              }))
            }
            placeholder="Company"
          />
        </FormField>
        <FormField label="Address">
          <AppInput
            value={contactFormValues.address}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                address: value,
              }))
            }
            placeholder="Address"
          />
        </FormField>
        <FormField label="Country">
          <AppInput
            value={contactFormValues.country}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                country: value,
              }))
            }
            placeholder="Country"
          />
        </FormField>
        <FormField label="City/Region">
          <AppInput
            value={contactFormValues.cityRegion}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                cityRegion: value,
              }))
            }
            placeholder="City"
          />
        </FormField>
        <FormField label="Tax ID">
          <AppInput
            value={contactFormValues.taxId}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                taxId: value,
              }))
            }
            placeholder="Tax identifier"
          />
        </FormField>
        <FormField label="Notes">
          <AppTextArea
            value={contactFormValues.notes}
            onChangeText={(value) =>
              setContactFormValues((prev) => ({
                ...prev,
                notes: value,
              }))
            }
            placeholder="Notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={notificationSheetVisible}
        title="Create Notification"
        footer={notificationSheetFooter}
        onDismiss={closeNotificationSheet}
      >
        <FormField label="Type">
          <AppSelect
            value={notificationFormValues.type}
            options={NOTIFICATION_TYPE_OPTIONS as unknown as { value: string; label: string }[]}
            onChange={(value) =>
              setNotificationFormValues((prev) => ({
                ...prev,
                type: value,
              }))
            }
          />
        </FormField>
        <FormField label="Title">
          <AppInput
            value={notificationFormValues.title}
            onChangeText={(value) =>
              setNotificationFormValues((prev) => ({
                ...prev,
                title: value,
              }))
            }
            placeholder="Notification title"
          />
        </FormField>
        <FormField label="Message">
          <AppTextArea
            value={notificationFormValues.message}
            onChangeText={(value) =>
              setNotificationFormValues((prev) => ({
                ...prev,
                message: value,
              }))
            }
            placeholder="Notification message"
          />
        </FormField>
      </BottomSheet>

      <ConfirmDialog
        visible={Boolean(confirmTarget)}
        title={
          confirmTarget?.type === 'notification-mark-read'
            ? 'Mark Notification as Read'
            : 'Confirm Action'
        }
        message={
          confirmTarget?.type === 'role-delete'
            ? `Delete role "${confirmTarget.role.name}"?`
            : confirmTarget?.type === 'invite-delete'
              ? `Delete invite "${confirmTarget.invite.email}"?`
              : confirmTarget?.type === 'notification-delete'
                ? `Delete notification "${confirmTarget.notification.title}"?`
                : confirmTarget?.type === 'notification-mark-read'
                  ? `Mark "${confirmTarget.notification.title}" as read?`
                  : 'Are you sure?'
        }
        confirmLabel={confirmTarget?.type === 'notification-mark-read' ? 'Mark Read' : 'Confirm'}
        confirmTone={confirmTarget?.type?.includes('delete') ? 'destructive' : 'primary'}
        confirmLoading={isMutating}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => void confirmAction()}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metric: {
    width: '48%',
    minWidth: 150,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  metricLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  metricValue: {
    ...typography.title,
    color: palette.foreground,
  },
  tabBody: {
    gap: spacing.sm,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  listBlock: {
    gap: spacing.xs,
  },
  inlineButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  accessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  accessLabel: {
    ...typography.body,
    color: palette.foreground,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
