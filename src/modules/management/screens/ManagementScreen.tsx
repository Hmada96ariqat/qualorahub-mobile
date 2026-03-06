import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, type ScrollView } from 'react-native';
import type { ManagedInvite, ManagedRole, ManagedUser } from '../../../api/modules/management';
import {
  ActionSheet,
  AlertStrip,
  AppButton,
  AppHeader,
  AppInput,
  AppScreen,
  AppSelect,
  BottomSheet,
  ConfirmDialog,
  DetailSectionCard,
  DotBadge,
  EmptyState,
  ErrorState,
  FormField,
  FormValidationProvider,
  HeaderActionGroup,
  ListRow,
  ModuleTabs,
  NotificationHeaderButton,
  PillTabs,
  ProfileCard,
  PullToRefreshContainer,
  SearchBar,
  SectionHeader,
  Skeleton,
  StatStrip,
  useFormValidation,
  useToast,
} from '../../../components';
import { useAuth } from '../../../providers/AuthProvider';
import { palette, spacing, typography } from '../../../theme/tokens';
import {
  createInviteTokenHash,
  resolveAccessState,
  toInviteFormValues,
  toRoleFormValues,
  toUserFormValues,
  type AccessState,
  type InviteFormValues,
  type RoleFormValues,
  type UserFormValues,
} from '../contracts';
import {
  toInviteDisplayName,
  toInviteRowSubtitle,
  toManagementDateLabel,
  toManagementIconVariant,
  toManagementStatusLabel,
  toManagementStatusVariant,
  toRoleRowSubtitle,
  toUserDisplayName,
  toUserRowSubtitle,
} from '../managementPresentation';
import { useManagementModule } from '../useManagementModule.hook';

type RoleFormMode = 'create' | 'edit';
type ManagementTab = 'users' | 'roles' | 'invites';
type UserListMode = 'all' | 'active' | 'inactive';
type ConfirmTarget =
  | { type: 'role-delete'; role: ManagedRole }
  | { type: 'invite-delete'; invite: ManagedInvite };

function isWritable(state: AccessState): boolean {
  return state === 'full';
}

function isVisible(state: AccessState): boolean {
  return state === 'full' || state === 'read-only';
}

function isActiveStatus(value: string | null | undefined): boolean {
  return value?.trim().toLowerCase() === 'active';
}

function isInactiveStatus(value: string | null | undefined): boolean {
  return value?.trim().toLowerCase() === 'inactive';
}

function toUserIcon(user: ManagedUser): string {
  return user.userType?.trim().toLowerCase() === 'owner'
    ? 'shield-account-outline'
    : 'account-circle-outline';
}

export function ManagementScreen() {
  const { showToast } = useToast();
  const { accessSnapshot, hasMenuAccess } = useAuth();
  const roleSheetScrollRef = useRef<ScrollView | null>(null);
  const roleValidation = useFormValidation<'name'>(roleSheetScrollRef);
  const inviteSheetScrollRef = useRef<ScrollView | null>(null);
  const inviteValidation = useFormValidation<'email' | 'fullName' | 'roleId' | 'expiresAt'>(
    inviteSheetScrollRef,
  );

  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState<ManagementTab>('users');
  const [userListMode, setUserListMode] = useState<UserListMode>('active');

  const [roleSheetVisible, setRoleSheetVisible] = useState(false);
  const [roleFormMode, setRoleFormMode] = useState<RoleFormMode>('create');
  const [editingRole, setEditingRole] = useState<ManagedRole | null>(null);
  const [roleFormValues, setRoleFormValues] = useState<RoleFormValues>(toRoleFormValues());

  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
  const [inviteFormValues, setInviteFormValues] = useState<InviteFormValues>(toInviteFormValues());

  const [userSheetVisible, setUserSheetVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [userFormValues, setUserFormValues] = useState<UserFormValues>(toUserFormValues());

  const [roleActionTarget, setRoleActionTarget] = useState<ManagedRole | null>(null);
  const [inviteActionTarget, setInviteActionTarget] = useState<ManagedInvite | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  const {
    users,
    roles,
    roleOptions,
    invites,
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
  } = useManagementModule();

  const roleName = accessSnapshot.context?.role ?? null;
  const accessState = useMemo(
    () =>
      resolveAccessState({
        roleName,
        moduleKey: 'users',
        menuAllowed: hasMenuAccess('users'),
        entitlementsSnapshot: accessSnapshot.entitlements,
      }),
    [roleName, hasMenuAccess, accessSnapshot.entitlements],
  );
  const canWriteUsers = isWritable(accessState);

  const roleOptionsForSelect = useMemo(
    () => roleOptions.map((item) => ({ value: item.id, label: item.name })),
    [roleOptions],
  );

  const activeUsersCount = useMemo(
    () => users.filter((user) => isActiveStatus(user.status)).length,
    [users],
  );
  const inactiveUsersCount = useMemo(
    () => users.filter((user) => isInactiveStatus(user.status)).length,
    [users],
  );
  const pendingInvitesCount = useMemo(
    () => invites.filter((invite) => invite.status.trim().toLowerCase() === 'pending').length,
    [invites],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return users.filter((user) => {
      const statusMatches =
        userListMode === 'all' ||
        (userListMode === 'active' && isActiveStatus(user.status)) ||
        (userListMode === 'inactive' && isInactiveStatus(user.status));

      if (!statusMatches) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        user.fullName ?? '',
        user.nickName ?? '',
        user.email,
        user.roleName ?? '',
        user.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [searchValue, userListMode, users]);

  const filteredRoles = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return roles;

    return roles.filter((role) => {
      const haystack = [role.name, role.status, String(role.permissions.length)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [roles, searchValue]);

  const filteredInvites = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return invites;

    return invites.filter((invite) => {
      const haystack = [invite.email, invite.fullName ?? '', invite.status].join(' ').toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [invites, searchValue]);

  const activeRolesCount = useMemo(
    () => roles.filter((role) => isActiveStatus(role.status)).length,
    [roles],
  );
  const inactiveRolesCount = useMemo(
    () => roles.filter((role) => isInactiveStatus(role.status)).length,
    [roles],
  );
  const acceptedInvitesCount = useMemo(
    () => invites.filter((invite) => invite.status.trim().toLowerCase() === 'accepted').length,
    [invites],
  );
  const expiredInvitesCount = useMemo(
    () => invites.filter((invite) => invite.status.trim().toLowerCase() === 'expired').length,
    [invites],
  );

  useEffect(() => {
    if (!selectedUser) return;
    const nextSelectedUser = users.find((user) => user.id === selectedUser.id) ?? null;
    if (!nextSelectedUser) {
      setSelectedUser(null);
      return;
    }
    if (nextSelectedUser !== selectedUser) {
      setSelectedUser(nextSelectedUser);
    }
  }, [selectedUser, users]);

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
    roleValidation.reset();
  }

  function openCreateRole() {
    resetRoleForm();
    setRoleSheetVisible(true);
  }

  function openEditRole(role: ManagedRole) {
    setRoleFormMode('edit');
    setEditingRole(role);
    setRoleFormValues(toRoleFormValues(role));
    roleValidation.reset();
    setRoleSheetVisible(true);
  }

  function closeRoleSheet() {
    setRoleSheetVisible(false);
    resetRoleForm();
  }

  function openInviteSheet() {
    setInviteFormValues(toInviteFormValues(roleOptions[0]?.id ?? ''));
    inviteValidation.reset();
    setInviteSheetVisible(true);
  }

  function closeInviteSheet() {
    setInviteSheetVisible(false);
    setInviteFormValues(toInviteFormValues(roleOptions[0]?.id ?? ''));
    inviteValidation.reset();
  }

  function openUserDetail(user: ManagedUser) {
    setSelectedUser(user);
  }

  function closeUserDetail() {
    setSelectedUser(null);
  }

  function openEditUser(user: ManagedUser) {
    setEditingUser(user);
    setUserFormValues(toUserFormValues(user));
    setUserSheetVisible(true);
  }

  function closeUserSheet() {
    setUserSheetVisible(false);
    setEditingUser(null);
    setUserFormValues(toUserFormValues());
  }

  async function submitRoleForm() {
    const name = roleFormValues.name.trim();
    const valid = roleValidation.validate([
      {
        field: 'name',
        message: 'Role name is required.',
        isValid: name.length > 0,
      },
    ]);
    if (!valid) {
      showNotice({
        title: 'Validation Error',
        message: 'Complete the highlighted fields.',
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
      showNotice({
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save role.',
        tone: 'error',
      });
    }
  }

  async function submitInviteForm() {
    const email = inviteFormValues.email.trim().toLowerCase();
    const fullName = inviteFormValues.fullName.trim();
    const roleId = inviteFormValues.roleId.trim();
    const expiresAt = inviteFormValues.expiresAt.trim();

    const valid = inviteValidation.validate([
      { field: 'email', message: 'Email is required.', isValid: email.length > 0 },
      { field: 'fullName', message: 'Full name is required.', isValid: fullName.length > 0 },
      { field: 'roleId', message: 'Role is required.', isValid: roleId.length > 0 },
      { field: 'expiresAt', message: 'Expiry is required.', isValid: expiresAt.length > 0 },
    ]);
    if (!valid) {
      showNotice({
        title: 'Validation Error',
        message: 'Complete the highlighted fields.',
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
      showNotice({
        title: 'Invite Failed',
        message: error instanceof Error ? error.message : 'Failed to create invite.',
        tone: 'error',
      });
    }
  }

  async function submitUserForm() {
    if (!editingUser) {
      showNotice({
        title: 'Update Failed',
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

    if (fullName.length > 0) payload.full_name = fullName;
    if (nickName.length > 0) payload.nick_name = nickName;
    payload.mobile_number = mobileNumber.length > 0 ? mobileNumber : null;
    if (status.length > 0) payload.status = status;
    if (roleId.length > 0) payload.role_id = roleId;

    if (Object.keys(payload).length === 0) {
      showNotice({
        title: 'Validation Error',
        message: 'At least one updatable user field is required.',
      });
      return;
    }

    try {
      const updatedUser = await updateUser(editingUser.id, payload);
      setSelectedUser(updatedUser);
      showNotice({
        title: 'User Updated',
        message: editingUser.email,
        tone: 'success',
      });
      closeUserSheet();
    } catch (error) {
      showNotice({
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update user profile.',
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
      } else {
        await deleteInvite(confirmTarget.invite.id);
        showNotice({
          title: 'Invite Removed',
          message: confirmTarget.invite.email,
          tone: 'success',
        });
      }
    } catch (error) {
      showNotice({
        title: 'Action Failed',
        message: error instanceof Error ? error.message : 'Action failed.',
        tone: 'error',
      });
    } finally {
      setConfirmTarget(null);
    }
  }

  const roleSheetFooter = (
    <View style={styles.sheetFooter}>
      <View style={styles.sheetButton}>
        <AppButton label="Cancel" mode="outlined" tone="neutral" onPress={closeRoleSheet} />
      </View>
      <View style={styles.sheetButton}>
        <AppButton
          label={roleFormMode === 'create' ? 'Create Role' : 'Update Role'}
          onPress={() => void submitRoleForm()}
          loading={isMutating}
          disabled={isMutating}
        />
      </View>
    </View>
  );

  const userSheetFooter = (
    <View style={styles.sheetFooter}>
      <View style={styles.sheetButton}>
        <AppButton label="Cancel" mode="outlined" tone="neutral" onPress={closeUserSheet} />
      </View>
      <View style={styles.sheetButton}>
        <AppButton
          label="Update User"
          onPress={() => void submitUserForm()}
          loading={isMutating}
          disabled={isMutating}
        />
      </View>
    </View>
  );

  const inviteSheetFooter = (
    <View style={styles.sheetFooter}>
      <View style={styles.sheetButton}>
        <AppButton label="Cancel" mode="outlined" tone="neutral" onPress={closeInviteSheet} />
      </View>
      <View style={styles.sheetButton}>
        <AppButton
          label="Create Invite"
          onPress={() => void submitInviteForm()}
          loading={isMutating}
          disabled={isMutating}
        />
      </View>
    </View>
  );

  return (
    <AppScreen padded={false}>
      <View style={styles.header}>
        <AppHeader
          title="Management"
          subtitle="Users, roles, and invites."
          menuButtonTestID="management-header-menu"
          rightAction={
            <HeaderActionGroup>
              <NotificationHeaderButton testID="management-header-notifications" />
            </HeaderActionGroup>
          }
        />
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder="Search users by name, role, or email..."
          testID="management-search-input"
        />
        <ModuleTabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ManagementTab)}
          tabs={[
            { value: 'users', label: 'Users' },
            { value: 'roles', label: 'Roles' },
            { value: 'invites', label: 'Invites' },
          ]}
          testID="management-module-tabs"
        />
      </View>

      <PullToRefreshContainer
        refreshing={isRefreshing}
        onRefresh={() => void refresh()}
        contentContainerStyle={styles.main}
      >
        {isLoading ? (
          <View style={styles.skeletonBlock}>
            <Skeleton height={72} />
            <Skeleton height={176} />
            <Skeleton height={176} />
            <Skeleton height={68} />
            <Skeleton height={68} />
          </View>
        ) : errorMessage ? (
          <ErrorState
            title="Management Data Failed"
            message={errorMessage}
            onRetry={() => void refresh()}
          />
        ) : !isVisible(accessState) ? (
          <EmptyState
            title={
              accessState === 'locked-subscription'
                ? 'User management locked by subscription'
                : 'User management blocked by role'
            }
            message={
              accessState === 'locked-subscription'
                ? 'Current subscription does not include user management.'
                : 'Your current role does not allow user management.'
            }
          />
        ) : (
          <>
            {accessState === 'read-only' ? (
              <AlertStrip
                title="Management is read-only"
                subtitle="You can review users, roles, and invites, but write actions are hidden."
                icon="eye-outline"
                borderColor={palette.warning}
                iconColor="#8B6914"
                testID="management-read-only-alert"
              />
            ) : null}

            {activeTab === 'users' ? (
              <>
                <StatStrip
                  items={[
                    { value: activeUsersCount, label: 'Active', color: 'green' },
                    { value: inactiveUsersCount, label: 'Inactive', color: 'amber' },
                    { value: users.length, label: 'Total', color: 'green' },
                  ]}
                  testID="management-stat-strip"
                />

                <PillTabs
                  value={userListMode}
                  onValueChange={(value) => setUserListMode(value as UserListMode)}
                  tabs={[
                    { value: 'all', label: `All (${users.length})` },
                    { value: 'active', label: `Active (${activeUsersCount})` },
                    { value: 'inactive', label: `Inactive (${inactiveUsersCount})` },
                  ]}
                  testID="management-user-tabs"
                />

                <SectionHeader
                  title="Users"
                  trailing={`${filteredUsers.length} shown`}
                  testID="management-users-header"
                />

                {filteredUsers.length === 0 ? (
                  <EmptyState
                    title={
                      userListMode === 'active'
                        ? 'No active users'
                        : userListMode === 'inactive'
                          ? 'No inactive users'
                          : 'No users'
                    }
                    message={
                      searchValue.trim().length > 0
                        ? 'No users match the current search.'
                        : userListMode === 'active'
                          ? 'No active users are available.'
                          : userListMode === 'inactive'
                            ? 'No inactive users are available.'
                            : 'No user profiles were returned.'
                    }
                  />
                ) : (
                  filteredUsers.map((user) => (
                    <ListRow
                      key={user.id}
                      icon={toUserIcon(user)}
                      iconVariant={toManagementIconVariant(user.status)}
                      title={toUserDisplayName(user)}
                      subtitle={toUserRowSubtitle(user)}
                      badge={
                        <DotBadge
                          label={toManagementStatusLabel(user.status)}
                          variant={toManagementStatusVariant(user.status)}
                        />
                      }
                      onPress={() => openUserDetail(user)}
                      testID={`management-user-row-${user.id}`}
                    />
                  ))
                )}
              </>
            ) : null}

            {activeTab === 'roles' ? (
              <>
                <StatStrip
                  items={[
                    { value: activeRolesCount, label: 'Active', color: 'green' },
                    { value: inactiveRolesCount, label: 'Inactive', color: 'amber' },
                    { value: roles.length, label: 'Total', color: 'green' },
                  ]}
                  testID="management-stat-strip"
                />

                <DetailSectionCard
                  title="Roles"
                  description="Create, update, and retire roles used by the user directory."
                  trailing={<Text style={styles.cardCount}>{filteredRoles.length}</Text>}
                  testID="management-roles-card"
                >
                  {canWriteUsers ? (
                    <View style={styles.cardActionRow}>
                      <AppButton label="Create Role" onPress={openCreateRole} />
                    </View>
                  ) : null}

                  {filteredRoles.length === 0 ? (
                    <EmptyState
                      title={searchValue.trim().length > 0 ? 'No matching roles' : 'No roles'}
                      message={
                        searchValue.trim().length > 0
                          ? 'No roles match the current search.'
                          : 'No roles are available for this farm yet.'
                      }
                      actionLabel={canWriteUsers && searchValue.trim().length === 0 ? 'Create Role' : undefined}
                      onAction={canWriteUsers && searchValue.trim().length === 0 ? openCreateRole : undefined}
                    />
                  ) : (
                    filteredRoles.map((role) => (
                      <ListRow
                        key={role.id}
                        icon="shield-account-outline"
                        iconVariant={toManagementIconVariant(role.status)}
                        title={role.name}
                        subtitle={toRoleRowSubtitle(role)}
                        badge={
                          <DotBadge
                            label={toManagementStatusLabel(role.status)}
                            variant={toManagementStatusVariant(role.status)}
                          />
                        }
                        onPress={canWriteUsers ? () => setRoleActionTarget(role) : undefined}
                        testID={`management-role-row-${role.id}`}
                      />
                    ))
                  )}
                </DetailSectionCard>
              </>
            ) : null}

            {activeTab === 'invites' ? (
              <>
                <StatStrip
                  items={[
                    { value: pendingInvitesCount, label: 'Pending', color: 'amber' },
                    { value: acceptedInvitesCount, label: 'Accepted', color: 'green' },
                    { value: expiredInvitesCount, label: 'Expired', color: 'red' },
                  ]}
                  testID="management-stat-strip"
                />

                <DetailSectionCard
                  title="Invites"
                  description="Track open user invitations and remove stale access requests."
                  trailing={<Text style={styles.cardCount}>{filteredInvites.length}</Text>}
                  testID="management-invites-card"
                >
                  {canWriteUsers ? (
                    <View style={styles.cardActionRow}>
                      <AppButton label="Create Invite" onPress={openInviteSheet} />
                    </View>
                  ) : null}

                  {filteredInvites.length === 0 ? (
                    <EmptyState
                      title={searchValue.trim().length > 0 ? 'No matching invites' : 'No invites'}
                      message={
                        searchValue.trim().length > 0
                          ? 'No invites match the current search.'
                          : 'No invites have been issued yet.'
                      }
                      actionLabel={canWriteUsers && searchValue.trim().length === 0 ? 'Create Invite' : undefined}
                      onAction={canWriteUsers && searchValue.trim().length === 0 ? openInviteSheet : undefined}
                    />
                  ) : (
                    filteredInvites.map((invite) => (
                      <ListRow
                        key={invite.id}
                        icon="email-fast-outline"
                        iconVariant={toManagementIconVariant(invite.status)}
                        title={toInviteDisplayName(invite)}
                        subtitle={toInviteRowSubtitle(invite)}
                        badge={
                          <DotBadge
                            label={toManagementStatusLabel(invite.status)}
                            variant={toManagementStatusVariant(invite.status)}
                          />
                        }
                        onPress={canWriteUsers ? () => setInviteActionTarget(invite) : undefined}
                        testID={`management-invite-row-${invite.id}`}
                      />
                    ))
                  )}
                </DetailSectionCard>
              </>
            ) : null}
          </>
        )}
      </PullToRefreshContainer>

      <BottomSheet
        visible={Boolean(selectedUser)}
        title={selectedUser ? toUserDisplayName(selectedUser) : 'User detail'}
        onDismiss={closeUserDetail}
      >
        {selectedUser ? (
          <>
            <ProfileCard
              icon={toUserIcon(selectedUser)}
              name={toUserDisplayName(selectedUser)}
              subtitle={`${selectedUser.roleName ?? 'No role'} · ${toManagementStatusLabel(selectedUser.status)}`}
              cells={[
                { label: 'Role', value: selectedUser.roleName ?? 'n/a' },
                { label: 'Status', value: toManagementStatusLabel(selectedUser.status) },
                { label: 'Type', value: selectedUser.userType ?? 'n/a' },
                { label: 'Updated', value: toManagementDateLabel(selectedUser.updatedAt) },
              ]}
              testID="management-user-profile"
            />

            {canWriteUsers ? (
              <View style={styles.detailPrimaryAction}>
                <AppButton
                  label="Edit User"
                  onPress={() => {
                    const user = selectedUser;
                    closeUserDetail();
                    openEditUser(user);
                  }}
                />
              </View>
            ) : null}

            <DetailSectionCard
              title="Profile"
              description="Primary identity and contact information for this user."
            >
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedUser.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nick Name</Text>
                <Text style={styles.detailValue}>{selectedUser.nickName ?? 'n/a'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValue}>{selectedUser.mobileNumber ?? 'n/a'}</Text>
              </View>
            </DetailSectionCard>

            <DetailSectionCard
              title="Access"
              description="Role assignment and account lifecycle details."
            >
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Profile ID</Text>
                <Text style={styles.detailValue}>{selectedUser.id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>User ID</Text>
                <Text style={styles.detailValue}>{selectedUser.userId ?? 'n/a'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {toManagementDateLabel(selectedUser.createdAt)}
                </Text>
              </View>
            </DetailSectionCard>
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={roleSheetVisible}
        title={roleFormMode === 'create' ? 'New Role' : 'Edit Role'}
        footer={roleSheetFooter}
        onDismiss={closeRoleSheet}
        scrollViewRef={roleSheetScrollRef}
      >
        <FormValidationProvider value={roleValidation.providerValue}>
          <DetailSectionCard
            title="Role Details"
            description="Define the role name used across the farm team."
          >
            <FormField label="Role Name" name="name" required>
              <AppInput
                value={roleFormValues.name}
                onChangeText={(value) => {
                  roleValidation.clearFieldError('name');
                  setRoleFormValues({ name: value });
                }}
                placeholder="Role name"
              />
            </FormField>
          </DetailSectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={userSheetVisible}
        title="Edit User"
        footer={userSheetFooter}
        onDismiss={closeUserSheet}
      >
        <DetailSectionCard
          title="Profile"
          description="Update the user-facing profile information stored for this account."
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
        </DetailSectionCard>

        <DetailSectionCard
          title="Access"
          description="Adjust the role assignment and lifecycle status for this user."
        >
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
        </DetailSectionCard>
      </BottomSheet>

      <BottomSheet
        visible={inviteSheetVisible}
        title="Create Invite"
        footer={inviteSheetFooter}
        onDismiss={closeInviteSheet}
        scrollViewRef={inviteSheetScrollRef}
      >
        <FormValidationProvider value={inviteValidation.providerValue}>
          <DetailSectionCard
            title="Invite Details"
            description="Issue an invite with the selected role and an explicit expiry."
          >
            <FormField label="Email" name="email" required>
              <AppInput
                value={inviteFormValues.email}
                onChangeText={(value) => {
                  inviteValidation.clearFieldError('email');
                  setInviteFormValues((prev) => ({
                    ...prev,
                    email: value,
                  }));
                }}
                placeholder="invite@example.test"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </FormField>
            <FormField label="Full Name" name="fullName" required>
              <AppInput
                value={inviteFormValues.fullName}
                onChangeText={(value) => {
                  inviteValidation.clearFieldError('fullName');
                  setInviteFormValues((prev) => ({
                    ...prev,
                    fullName: value,
                  }));
                }}
                placeholder="Invitee name"
              />
            </FormField>
            <FormField label="Role" name="roleId" required>
              <AppSelect
                value={inviteFormValues.roleId}
                options={roleOptionsForSelect}
                onChange={(value) => {
                  inviteValidation.clearFieldError('roleId');
                  setInviteFormValues((prev) => ({
                    ...prev,
                    roleId: value,
                  }));
                }}
              />
            </FormField>
            <FormField label="Expires At (ISO)" name="expiresAt" required>
              <AppInput
                value={inviteFormValues.expiresAt}
                onChangeText={(value) => {
                  inviteValidation.clearFieldError('expiresAt');
                  setInviteFormValues((prev) => ({
                    ...prev,
                    expiresAt: value,
                  }));
                }}
                placeholder="2026-03-04T00:00:00.000Z"
                autoCapitalize="none"
              />
            </FormField>
          </DetailSectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <ActionSheet
        visible={Boolean(roleActionTarget)}
        title={roleActionTarget?.name}
        message="Choose an action for this role."
        actions={
          roleActionTarget
            ? [
                {
                  key: 'edit',
                  label: 'Edit Role',
                  onPress: () => openEditRole(roleActionTarget),
                },
                {
                  key: 'delete',
                  label: 'Delete Role',
                  destructive: true,
                  onPress: () => setConfirmTarget({ type: 'role-delete', role: roleActionTarget }),
                },
              ]
            : []
        }
        onDismiss={() => setRoleActionTarget(null)}
      />

      <ActionSheet
        visible={Boolean(inviteActionTarget)}
        title={inviteActionTarget ? toInviteDisplayName(inviteActionTarget) : undefined}
        message="Choose an action for this invite."
        actions={
          inviteActionTarget
            ? [
                {
                  key: 'delete',
                  label: 'Delete Invite',
                  destructive: true,
                  onPress: () =>
                    setConfirmTarget({ type: 'invite-delete', invite: inviteActionTarget }),
                },
              ]
            : []
        }
        onDismiss={() => setInviteActionTarget(null)}
      />

      <ConfirmDialog
        visible={Boolean(confirmTarget)}
        title="Confirm Action"
        message={
          confirmTarget?.type === 'role-delete'
            ? `Delete role "${confirmTarget.role.name}"?`
            : confirmTarget?.type === 'invite-delete'
              ? `Delete invite "${confirmTarget.invite.email}"?`
              : 'Are you sure?'
        }
        confirmLabel="Confirm"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => void confirmAction()}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  main: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  skeletonBlock: {
    gap: spacing.sm,
  },
  cardCount: {
    ...typography.title,
    color: palette.foreground,
  },
  cardActionRow: {
    marginBottom: spacing.sm,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sheetButton: {
    flex: 1,
  },
  detailPrimaryAction: {
    marginBottom: spacing.sm,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  detailValue: {
    ...typography.body,
    color: palette.foreground,
  },
});
