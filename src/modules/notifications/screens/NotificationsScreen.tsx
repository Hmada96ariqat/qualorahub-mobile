import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type ScrollView } from 'react-native';
import {
  AppButton,
  AppHeader,
  AppInput,
  AppListItem,
  AppScreen,
  AppSection,
  AppSelect,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  FormField,
  FormValidationProvider,
  PullToRefreshContainer,
  SectionCard,
  Skeleton,
  SystemHeaderActions,
  useFormValidation,
  useToast,
} from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { useAuth } from '../../../providers/AuthProvider';
import { spacing } from '../../../theme/tokens';
import { useManagedNotifications } from '../../../hooks/useManagedNotifications.hook';
import {
  NOTIFICATION_TYPE_OPTIONS,
  toNotificationFormValues,
  toReadAtNow,
  type NotificationFormValues,
} from '../../../utils/managed-notifications';
import { resolveAccessState, type AccessState } from '../../../utils/management-access';
import type { ManagedNotification } from '../../../api/modules/management';

type ConfirmTarget =
  | { type: 'notification-delete'; notification: ManagedNotification }
  | { type: 'notification-mark-read'; notification: ManagedNotification };

function isWritable(state: AccessState): boolean {
  return state === 'full';
}

function isVisible(state: AccessState): boolean {
  return state === 'full' || state === 'read-only';
}

export function NotificationsScreen() {
  const { t } = useAppI18n();
  const { showToast } = useToast();
  const { accessSnapshot, hasMenuAccess } = useAuth();
  const notificationSheetScrollRef = useRef<ScrollView | null>(null);
  const notificationValidation = useFormValidation<'type' | 'title' | 'message'>(
    notificationSheetScrollRef,
  );
  const [searchValue, setSearchValue] = useState('');
  const [notificationSheetVisible, setNotificationSheetVisible] = useState(false);
  const [notificationFormValues, setNotificationFormValues] = useState<NotificationFormValues>(
    toNotificationFormValues(),
  );
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  const {
    notifications,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    createNotification,
    updateNotification,
    deleteNotification,
  } = useManagedNotifications();

  const filteredNotifications = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return notifications;
    return notifications.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    });
  }, [notifications, searchValue]);

  const accessState = useMemo(
    () =>
      resolveAccessState({
        roleType: accessSnapshot.rbac?.type ?? accessSnapshot.context?.role ?? null,
        rbacPermissions: accessSnapshot.rbac?.permissions,
        moduleKey: 'notifications',
        menuAllowed: hasMenuAccess('notifications'),
        entitlementsSnapshot: accessSnapshot.entitlements,
      }),
    [accessSnapshot.rbac?.type, accessSnapshot.rbac?.permissions, accessSnapshot.context?.role, accessSnapshot.entitlements, hasMenuAccess],
  );
  const canWriteNotifications = isWritable(accessState);

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

  function openNotificationSheet() {
    setNotificationFormValues(toNotificationFormValues());
    setNotificationSheetVisible(true);
  }

  function closeNotificationSheet() {
    setNotificationSheetVisible(false);
    setNotificationFormValues(toNotificationFormValues());
    notificationValidation.reset();
  }

  async function submitNotificationForm() {
    const title = notificationFormValues.title.trim();
    const message = notificationFormValues.message.trim();
    const type = notificationFormValues.type.trim();

    const valid = notificationValidation.validate([
      { field: 'type', message: 'Notification type is required.', isValid: type.length > 0 },
      { field: 'title', message: 'Notification title is required.', isValid: title.length > 0 },
      {
        field: 'message',
        message: 'Notification message is required.',
        isValid: message.length > 0,
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
      showNotice({
        title: 'Create Failed',
        message: error instanceof Error ? error.message : 'Failed to create notification.',
        tone: 'error',
      });
    }
  }

  async function confirmAction() {
    if (!confirmTarget) return;

    try {
      if (confirmTarget.type === 'notification-delete') {
        await deleteNotification(confirmTarget.notification.id);
        showNotice({
          title: 'Notification Deleted',
          message: confirmTarget.notification.title,
          tone: 'success',
        });
      } else {
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
      showNotice({
        title: 'Action Failed',
        message: error instanceof Error ? error.message : 'Action failed.',
        tone: 'error',
      });
    } finally {
      setConfirmTarget(null);
    }
  }

  const notificationSheetFooter = (
    <View style={styles.sheetFooter}>
      <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeNotificationSheet} />
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
        title={t('system', 'headers.notifications.title', 'Notifications')}
        subtitle={t('system', 'headers.notifications.subtitle', 'In-app notification center.')}
        rightAction={
          <SystemHeaderActions notificationTestID="notifications-header-notifications" />
        }
      />

      <PullToRefreshContainer
        refreshing={isRefreshing}
        onRefresh={() => void refresh()}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topActions}>
          <AppButton label="Refresh" onPress={() => void refresh()} loading={isRefreshing} />
        </View>

        {!isVisible(accessState) ? (
          <SectionCard>
            <EmptyState
              title={
                accessState === 'locked-subscription'
                  ? 'Notifications locked by subscription'
                  : 'Notifications blocked by role'
              }
              message={
                accessState === 'locked-subscription'
                  ? 'Current subscription does not include notifications.'
                  : 'Your current role does not allow this module.'
              }
            />
          </SectionCard>
        ) : (
          <>
            {accessState === 'read-only' ? (
              <SectionCard>
                <EmptyState
                  title="Notifications in read-only mode"
                  message="You can view records, but write actions are disabled for your current role or entitlement mode."
                />
              </SectionCard>
            ) : null}

            <SectionCard>
              <AppSection
                title="Notifications Center"
                description="In-app notification list with read and delete actions."
              >
                <FilterBar
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  searchPlaceholder="Search notifications"
                />

                <View style={styles.rowActions}>
                  <AppButton
                    label="Create Notification"
                    onPress={openNotificationSheet}
                    disabled={!canWriteNotifications}
                  />
                </View>

                {isLoading ? (
                  <View style={styles.skeletonBlock}>
                    <Skeleton height={84} />
                    <Skeleton height={84} />
                  </View>
                ) : errorMessage ? (
                  <ErrorState
                    title="Notifications Failed"
                    message={errorMessage}
                    onRetry={() => void refresh()}
                  />
                ) : filteredNotifications.length === 0 ? (
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
        )}
      </PullToRefreshContainer>

      <BottomSheet
        visible={notificationSheetVisible}
        title="Create Notification"
        footer={notificationSheetFooter}
        onDismiss={closeNotificationSheet}
        scrollViewRef={notificationSheetScrollRef}
      >
        <FormValidationProvider value={notificationValidation.providerValue}>
          <FormField label="Type" name="type" required>
            <AppSelect
              value={notificationFormValues.type}
              options={NOTIFICATION_TYPE_OPTIONS as unknown as { value: string; label: string }[]}
              onChange={(value) => {
                notificationValidation.clearFieldError('type');
                setNotificationFormValues((prev) => ({
                  ...prev,
                  type: value,
                }));
              }}
            />
          </FormField>
          <FormField label="Title" name="title" required>
            <AppInput
              value={notificationFormValues.title}
              onChangeText={(value) => {
                notificationValidation.clearFieldError('title');
                setNotificationFormValues((prev) => ({
                  ...prev,
                  title: value,
                }));
              }}
              placeholder="Notification title"
            />
          </FormField>
          <FormField label="Message" name="message" required>
            <AppTextArea
              value={notificationFormValues.message}
              onChangeText={(value) => {
                notificationValidation.clearFieldError('message');
                setNotificationFormValues((prev) => ({
                  ...prev,
                  message: value,
                }));
              }}
              placeholder="Notification message"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      <ConfirmDialog
        visible={Boolean(confirmTarget)}
        title={
          confirmTarget?.type === 'notification-mark-read'
            ? 'Mark Notification as Read'
            : 'Confirm Action'
        }
        message={
          confirmTarget?.type === 'notification-delete'
            ? `Delete notification "${confirmTarget.notification.title}"?`
            : confirmTarget?.type === 'notification-mark-read'
              ? `Mark "${confirmTarget.notification.title}" as read?`
              : 'Are you sure?'
        }
        confirmLabel={confirmTarget?.type === 'notification-mark-read' ? 'Mark Read' : 'Confirm'}
        confirmTone={confirmTarget?.type === 'notification-delete' ? 'destructive' : 'primary'}
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
  rowActions: {
    marginBottom: spacing.sm,
  },
  listBlock: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inlineButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  skeletonBlock: {
    gap: spacing.sm,
  },
});
