import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, type ScrollView } from 'react-native';
import type { ManagedContact } from '../../../api/modules/management';
import {
  AlertStrip,
  AppButton,
  AppChip,
  AppHeader,
  AppInput,
  AppScreen,
  AppSelect,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  DetailSectionCard,
  DotBadge,
  EmptyState,
  ErrorState,
  FormField,
  FormValidationProvider,
  HeaderIconButton,
  ListRow,
  PaginationFooter,
  PillTabs,
  ProfileCard,
  PullToRefreshContainer,
  QuickActionGrid,
  SearchBar,
  SectionHeader,
  Skeleton,
  StatStrip,
  SystemHeaderActions,
  useFormValidation,
  useToast,
} from '../../../components';
import type { QuickAction } from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { useAuth } from '../../../providers/AuthProvider';
import { palette, spacing, typography } from '../../../theme/tokens';
import {
  useManagedContacts,
  type ManagedContactStatusFilter,
} from '../../../hooks/useManagedContacts.hook';
import {
  CONTACT_STATUS_OPTIONS,
  CONTACT_TYPE_OPTIONS,
  parseCsvValues,
  toContactFormValues,
  type ContactFormValues,
} from '../../../utils/managed-contacts';
import { resolveAccessState, type AccessState } from '../../../utils/management-access';
import {
  toContactAddressLabel,
  toContactDateLabel,
  toContactIcon,
  toContactIconVariant,
  toContactLocationLabel,
  toContactRowSubtitle,
  toContactStatusLabel,
  toContactStatusVariant,
  toContactTypeLabel,
  toContactTypesLabels,
} from '../contactPresentation';

type ContactFormMode = 'create' | 'edit';

const CONTACT_PAGE_SIZE = 10;

function isWritable(state: AccessState): boolean {
  return state === 'full';
}

function isVisible(state: AccessState): boolean {
  return state === 'full' || state === 'read-only';
}

function toEmptyStateTitle(statusFilter: ManagedContactStatusFilter): string {
  if (statusFilter === 'active') return 'No active contacts';
  if (statusFilter === 'inactive') return 'No inactive contacts';
  return 'No contacts';
}

function toEmptyStateMessage(statusFilter: ManagedContactStatusFilter, searchValue: string): string {
  if (searchValue.trim().length > 0) {
    return 'No contacts match the current search.';
  }
  if (statusFilter === 'active') {
    return 'There are no active contacts in this farm directory yet.';
  }
  if (statusFilter === 'inactive') {
    return 'There are no inactive contacts in this farm directory.';
  }
  return 'Create the first contact for this farm directory.';
}

function renderDetailValue(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : 'n/a';
}

export function ContactsScreen() {
  const { t } = useAppI18n();
  const { showToast } = useToast();
  const { accessSnapshot, hasMenuAccess } = useAuth();
  const contactSheetScrollRef = useRef<ScrollView | null>(null);
  const contactValidation = useFormValidation<'name' | 'contactTypesCsv'>(contactSheetScrollRef);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ManagedContactStatusFilter>('active');
  const [searchValue, setSearchValue] = useState('');
  const [selectedContact, setSelectedContact] = useState<ManagedContact | null>(null);
  const [contactSheetVisible, setContactSheetVisible] = useState(false);
  const [contactFormMode, setContactFormMode] = useState<ContactFormMode>('create');
  const [editingContact, setEditingContact] = useState<ManagedContact | null>(null);
  const [contactFormValues, setContactFormValues] = useState<ContactFormValues>(toContactFormValues());
  const [pendingStatusTarget, setPendingStatusTarget] = useState<ManagedContact | null>(null);
  const [pendingStatusValue, setPendingStatusValue] = useState<'active' | 'inactive' | null>(null);

  const {
    contactsPage,
    summaryCounts,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    createContact,
    updateContact,
  } = useManagedContacts({
    page,
    pageSize: CONTACT_PAGE_SIZE,
    search: searchValue,
    statusFilter,
  });

  const accessState = useMemo(
    () =>
      resolveAccessState({
        roleName: accessSnapshot.context?.role ?? null,
        moduleKey: 'contacts',
        menuAllowed: hasMenuAccess('contacts'),
        entitlementsSnapshot: accessSnapshot.entitlements,
      }),
    [accessSnapshot.context?.role, accessSnapshot.entitlements, hasMenuAccess],
  );
  const canWriteContacts = isWritable(accessState);

  useEffect(() => {
    if (!selectedContact) return;

    const updatedContact = contactsPage.items.find((contact) => contact.id === selectedContact.id);
    if (updatedContact && updatedContact !== selectedContact) {
      setSelectedContact(updatedContact);
    }
  }, [contactsPage.items, selectedContact]);

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

  function resetContactForm() {
    setContactFormMode('create');
    setEditingContact(null);
    setContactFormValues(toContactFormValues());
    contactValidation.reset();
  }

  function openCreateContact() {
    resetContactForm();
    setContactSheetVisible(true);
  }

  function openContactDetail(contact: ManagedContact) {
    setSelectedContact(contact);
  }

  function closeContactDetail() {
    setSelectedContact(null);
  }

  function openEditContact(contact: ManagedContact) {
    setContactFormMode('edit');
    setEditingContact(contact);
    setContactFormValues(toContactFormValues(contact));
    contactValidation.reset();
    setContactSheetVisible(true);
  }

  function closeContactSheet() {
    setContactSheetVisible(false);
    resetContactForm();
  }

  async function submitContactForm() {
    const name = contactFormValues.name.trim();
    const type = contactFormValues.type.trim().toLowerCase();
    const contactTypes = parseCsvValues(contactFormValues.contactTypesCsv.toLowerCase());

    const valid = contactValidation.validate([
      { field: 'name', message: 'Contact name is required.', isValid: name.length > 0 },
      {
        field: 'contactTypesCsv',
        message: 'At least one contact type is required.',
        isValid: contactTypes.length > 0,
      },
    ]);
    if (!valid) {
      showNotice({
        title: 'Validation Error',
        message: 'Complete the highlighted fields.',
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
        const updatedContact = await updateContact(editingContact.id, payload);
        setSelectedContact(updatedContact);
        showNotice({
          title: 'Contact Updated',
          message: `${name} updated.`,
          tone: 'success',
        });
      }
      closeContactSheet();
    } catch (error) {
      showNotice({
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save contact.',
        tone: 'error',
      });
    }
  }

  function requestStatusChange(contact: ManagedContact, nextStatus: 'active' | 'inactive') {
    setPendingStatusTarget(contact);
    setPendingStatusValue(nextStatus);
  }

  async function submitStatusChange() {
    if (!pendingStatusTarget || !pendingStatusValue) return;

    try {
      const updatedContact = await updateContact(pendingStatusTarget.id, {
        status: pendingStatusValue,
      });
      const shouldKeepVisible =
        statusFilter === 'all' || updatedContact.status.trim().toLowerCase() === statusFilter;

      setSelectedContact(shouldKeepVisible ? updatedContact : null);
      showNotice({
        title: pendingStatusValue === 'active' ? 'Contact Activated' : 'Contact Deactivated',
        message: `${updatedContact.name} updated.`,
        tone: 'success',
      });
    } catch (error) {
      showNotice({
        title: 'Status Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update contact status.',
        tone: 'error',
      });
    } finally {
      setPendingStatusTarget(null);
      setPendingStatusValue(null);
    }
  }

  const detailQuickActions = useMemo<QuickAction[]>(() => {
    if (!selectedContact || !canWriteContacts) return [];

    const actions: QuickAction[] = [
      {
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => openEditContact(selectedContact),
      },
    ];

    actions.push(
      selectedContact.status.trim().toLowerCase() === 'inactive'
        ? {
            key: 'activate',
            icon: 'check-circle-outline',
            label: 'Activate',
            color: 'green',
            onPress: () => requestStatusChange(selectedContact, 'active'),
          }
        : {
            key: 'deactivate',
            icon: 'close-circle-outline',
            label: 'Deactivate',
            color: 'red',
            onPress: () => requestStatusChange(selectedContact, 'inactive'),
          },
    );

    return actions;
  }, [canWriteContacts, selectedContact]);

  const detailContactTypeLabels = useMemo(
    () => (selectedContact ? toContactTypesLabels(selectedContact) : []),
    [selectedContact],
  );

  const contactSheetFooter = (
    <View style={styles.sheetFooter}>
      <View style={styles.sheetButton}>
        <AppButton label="Cancel" mode="outlined" tone="neutral" onPress={closeContactSheet} />
      </View>
      <View style={styles.sheetButton}>
        <AppButton
          label={contactFormMode === 'create' ? 'Create' : 'Save'}
          onPress={() => void submitContactForm()}
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
          title={t('system', 'headers.contacts.title', 'Contacts')}
          subtitle={t(
            'system',
            'headers.contacts.subtitle',
            'Farm directory for suppliers, customers, and operational partners.',
          )}
          menuButtonTestID="contacts-header-menu"
          rightAction={
            <SystemHeaderActions notificationTestID="contacts-header-notifications">
              {canWriteContacts ? (
                <HeaderIconButton
                  icon="plus"
                  onPress={openCreateContact}
                  filled
                  testID="contacts-header-create"
                />
              ) : null}
            </SystemHeaderActions>
          }
        />
        <SearchBar
          value={searchValue}
          onChangeText={(value) => {
            setSearchValue(value);
            setPage(1);
          }}
          placeholder="Search by name, company, email, phone..."
          testID="contacts-search-input"
        />
      </View>

      <PullToRefreshContainer
        refreshing={isRefreshing}
        onRefresh={() => void refresh()}
        contentContainerStyle={styles.main}
      >
        {!isVisible(accessState) ? (
          <View style={styles.stateBlock}>
            <EmptyState
              title={
                accessState === 'locked-subscription'
                  ? 'Contacts locked by subscription'
                  : 'Contacts blocked by role'
              }
              message={
                accessState === 'locked-subscription'
                  ? 'Current subscription does not include contacts.'
                  : 'Your current role does not allow this module.'
              }
            />
          </View>
        ) : (
          <>
            {accessState === 'read-only' ? (
              <AlertStrip
                title="Contacts are read-only"
                subtitle="You can view records, but write actions are hidden for your current access."
                icon="eye-outline"
                borderColor={palette.warning}
                iconColor="#8B6914"
                testID="contacts-read-only-alert"
              />
            ) : null}

            <StatStrip
              items={[
                { value: summaryCounts.all, label: 'All', color: 'amber' },
                { value: summaryCounts.active, label: 'Active', color: 'green' },
                { value: summaryCounts.inactive, label: 'Inactive', color: 'red' },
              ]}
              testID="contacts-stat-strip"
            />

            <PillTabs
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as ManagedContactStatusFilter);
                setPage(1);
              }}
              tabs={[
                { value: 'all', label: `All (${summaryCounts.all})` },
                { value: 'active', label: `Active (${summaryCounts.active})` },
                { value: 'inactive', label: `Inactive (${summaryCounts.inactive})` },
              ]}
              testID="contacts-status-tabs"
            />

            <SectionHeader
              title="Contacts"
              trailing={`${contactsPage.total} total`}
              testID="contacts-section-header"
            />

            {isLoading ? (
              <View style={styles.skeletonBlock}>
                <Skeleton height={68} />
                <Skeleton height={68} />
                <Skeleton height={68} />
              </View>
            ) : errorMessage ? (
              <ErrorState
                title="Contacts Failed"
                message={errorMessage}
                onRetry={() => void refresh()}
              />
            ) : contactsPage.items.length === 0 ? (
              <EmptyState
                title={toEmptyStateTitle(statusFilter)}
                message={toEmptyStateMessage(statusFilter, searchValue)}
                actionLabel={canWriteContacts ? 'Create contact' : undefined}
                onAction={canWriteContacts ? openCreateContact : undefined}
              />
            ) : (
              contactsPage.items.map((contact) => (
                <ListRow
                  key={contact.id}
                  icon={toContactIcon(contact.type)}
                  iconVariant={toContactIconVariant(contact.status)}
                  title={contact.name}
                  subtitle={toContactRowSubtitle(contact)}
                  badge={
                    <DotBadge
                      label={toContactStatusLabel(contact.status)}
                      variant={toContactStatusVariant(contact.status)}
                    />
                  }
                  onPress={() => openContactDetail(contact)}
                  testID={`contacts-row-${contact.id}`}
                />
              ))
            )}

            <PaginationFooter
              page={page}
              pageSize={CONTACT_PAGE_SIZE}
              totalItems={contactsPage.total}
              loading={isRefreshing}
              onPageChange={setPage}
            />
          </>
        )}
      </PullToRefreshContainer>

      <BottomSheet
        visible={Boolean(selectedContact)}
        title={selectedContact?.name ?? 'Contact detail'}
        onDismiss={closeContactDetail}
      >
        {selectedContact ? (
          <>
            <ProfileCard
              icon={toContactIcon(selectedContact.type)}
              name={selectedContact.name}
              subtitle={`${toContactTypeLabel(selectedContact.type)} · ${toContactStatusLabel(selectedContact.status)}`}
              cells={[
                { label: 'Company', value: renderDetailValue(selectedContact.company) },
                { label: 'Email', value: renderDetailValue(selectedContact.email) },
                { label: 'Phone', value: renderDetailValue(selectedContact.phone) },
                { label: 'Location', value: toContactLocationLabel(selectedContact) },
                { label: 'Updated', value: toContactDateLabel(selectedContact.updatedAt) },
              ]}
              testID="contacts-detail-profile"
            />

            {detailQuickActions.length > 0 ? (
              <QuickActionGrid actions={detailQuickActions} testID="contacts-detail-actions" />
            ) : null}

            <DetailSectionCard
              title="Contact Types"
              description="Canonical classifications used across the farm directory."
            >
              {detailContactTypeLabels.length > 0 ? (
                <View style={styles.chipRow}>
                  {detailContactTypeLabels.map((label) => (
                    <AppChip key={label} label={label} disabled />
                  ))}
                </View>
              ) : (
                <Text style={styles.detailMuted}>No contact types stored.</Text>
              )}
            </DetailSectionCard>

            <DetailSectionCard
              title="Directory Details"
              description="Stored metadata used by orders, equipment, and other farm modules."
            >
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{toContactAddressLabel(selectedContact)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tax ID</Text>
                <Text style={styles.detailValue}>{renderDetailValue(selectedContact.taxId)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{toContactDateLabel(selectedContact.createdAt)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{renderDetailValue(selectedContact.notes)}</Text>
              </View>
            </DetailSectionCard>
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={contactSheetVisible}
        title={contactFormMode === 'create' ? 'New Contact' : 'Edit Contact'}
        footer={contactSheetFooter}
        onDismiss={closeContactSheet}
        scrollViewRef={contactSheetScrollRef}
      >
        <FormValidationProvider value={contactValidation.providerValue}>
          <DetailSectionCard
            title="Identity"
            description="Core directory fields used for contact classification and status."
          >
            <FormField label="Name" name="name" required>
              <AppInput
                value={contactFormValues.name}
                onChangeText={(value) => {
                  contactValidation.clearFieldError('name');
                  setContactFormValues((prev) => ({
                    ...prev,
                    name: value,
                  }));
                }}
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

            <FormField label="Contact Types (CSV)" name="contactTypesCsv" required>
              <AppInput
                value={contactFormValues.contactTypesCsv}
                onChangeText={(value) => {
                  contactValidation.clearFieldError('contactTypesCsv');
                  setContactFormValues((prev) => ({
                    ...prev,
                    contactTypesCsv: value,
                  }));
                }}
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
          </DetailSectionCard>

          <DetailSectionCard
            title="Contact Channels"
            description="Optional ways to reach or identify this contact in daily operations."
          >
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
          </DetailSectionCard>

          <DetailSectionCard
            title="Regional Details"
            description="Optional tax, location, and notes metadata."
          >
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
                placeholder="City or region"
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
          </DetailSectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <ConfirmDialog
        visible={Boolean(pendingStatusTarget && pendingStatusValue)}
        title={pendingStatusValue === 'active' ? 'Activate Contact' : 'Deactivate Contact'}
        message={
          pendingStatusValue === 'active'
            ? `Activate ${pendingStatusTarget?.name ?? 'this contact'}?`
            : `Deactivate ${pendingStatusTarget?.name ?? 'this contact'}?`
        }
        confirmLabel={pendingStatusValue === 'active' ? 'Activate' : 'Deactivate'}
        confirmTone={pendingStatusValue === 'active' ? 'primary' : 'destructive'}
        confirmLoading={isMutating}
        onConfirm={() => void submitStatusChange()}
        onCancel={() => {
          setPendingStatusTarget(null);
          setPendingStatusValue(null);
        }}
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
  stateBlock: {
    paddingTop: spacing.sm,
  },
  skeletonBlock: {
    gap: spacing.sm,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  sheetButton: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  detailMuted: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
});
