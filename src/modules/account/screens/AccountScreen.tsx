import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppBadge,
  AppButton,
  AppHeader,
  AppListItem,
  AppScreen,
  AppSection,
  EmptyState,
  ErrorState,
  PullToRefreshContainer,
  SectionCard,
  Skeleton,
  SystemHeaderActions,
} from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { useAuth } from '../../../providers/AuthProvider';
import { spacing } from '../../../theme/tokens';
import { useAccountModule } from '../../../hooks/useAccountModule.hook';
import {
  resolveAccessState,
  type AccessState,
  type ManagementModuleKey,
} from '../../../utils/management-access';

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

function moduleLabel(moduleKey: ManagementModuleKey): string {
  if (moduleKey === 'users') return 'Users';
  if (moduleKey === 'contacts') return 'Contacts';
  return 'Notifications';
}

export function AccountScreen() {
  const { t } = useAppI18n();
  const { accessSnapshot, hasMenuAccess } = useAuth();
  const { subscription, isLoading, isRefreshing, errorMessage, refresh } = useAccountModule();

  const moduleAccessStates = useMemo(
    () =>
      (['users', 'contacts', 'notifications'] as ManagementModuleKey[]).map((moduleKey) => ({
        moduleKey,
        state: resolveAccessState({
          roleName: accessSnapshot.context?.role ?? null,
          moduleKey,
          menuAllowed: hasMenuAccess(moduleKey),
          entitlementsSnapshot: accessSnapshot.entitlements,
        }),
      })),
    [accessSnapshot.context?.role, accessSnapshot.entitlements, hasMenuAccess],
  );

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
    <AppScreen padded={false}>
      <AppHeader
        title={t('system', 'headers.account.title', 'Account')}
        subtitle={t(
          'system',
          'headers.account.subtitle',
          'Profile context, subscription, and access state.',
        )}
        rightAction={
          <SystemHeaderActions notificationTestID="account-header-notifications" />
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

        <SectionCard>
          <AppSection title="Profile Context" description="Current authenticated user context.">
            <AppListItem
              title="Email"
              description={accessSnapshot.context?.email ?? 'n/a'}
              leftIcon="email-outline"
            />
            <AppListItem
              title="Role"
              description={accessSnapshot.context?.role ?? 'n/a'}
              leftIcon="shield-account"
            />
            <AppListItem
              title="Farm"
              description={accessSnapshot.context?.farmId ?? 'n/a'}
              leftIcon="map-marker"
            />
          </AppSection>
        </SectionCard>

        <SectionCard>
          <AppSection
            title="Subscription Snapshot"
            description="Read-only state and plan period from /subscriptions/me."
          >
            {isLoading ? (
              <View style={styles.skeletonBlock}>
                <Skeleton height={52} />
                <Skeleton height={52} />
              </View>
            ) : errorMessage ? (
              <ErrorState
                title="Account Failed"
                message={errorMessage}
                onRetry={() => void refresh()}
              />
            ) : !subscription ? (
              <EmptyState
                title="No Subscription Snapshot"
                message="Subscription data is currently unavailable."
              />
            ) : (
              <>
                <AppListItem
                  title="Status"
                  description={
                    (subscription as { subscription?: { status?: string } } | null)?.subscription?.status ??
                    'n/a'
                  }
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
              </>
            )}
          </AppSection>
        </SectionCard>

        <SectionCard>
          <AppSection
            title="Module Access States"
            description="Resolved state by role, menu access, and entitlement mode."
          >
            {moduleAccessStates.map((item) => (
              <View key={item.moduleKey} style={styles.accessRow}>
                <AppListItem title={moduleLabel(item.moduleKey)} description="" />
                <AppBadge
                  value={accessBadgeLabel(item.state)}
                  variant={accessBadgeVariant(item.state)}
                />
              </View>
            ))}
          </AppSection>
        </SectionCard>
      </PullToRefreshContainer>
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
  skeletonBlock: {
    gap: spacing.sm,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
