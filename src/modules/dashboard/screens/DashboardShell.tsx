import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from 'react-native-paper';
import {
  AppBadge,
  AppChip,
  AppListItem,
  AppScreen,
  EmptyState,
  ErrorState,
  HeaderMenuButton,
  ListRow,
  NotificationHeaderButton,
  PillTabs,
  ProfileCard,
  PullToRefreshContainer,
  QuickActionGrid,
  SectionCard,
  SectionHeader,
  Skeleton,
  StatStrip,
  type ListRowIconVariant,
  type QuickAction,
} from '../../../components';
import { resolvePermissionKeys } from '../../../hooks/usePermissionGate';
import { useAuth } from '../../../providers/AuthProvider';
import { palette, spacing, typography } from '../../../theme/tokens';
import { useDashboardSnapshot } from '../useDashboardSnapshot.hook';
import {
  PROTECTED_NAVIGATION_GROUPS,
  PROTECTED_NAVIGATION_ITEMS,
  type ProtectedNavigationGroupKey,
} from '../../../navigation/protectedNavigation';

type Props = {
  email: string;
};

type DashboardTab = 'overview' | 'context' | 'access';

function toFetchedAtLabel(value: string | null | undefined): string {
  if (!value) return 'Pending';
  return `${value.slice(0, 10)} • ${value.slice(11, 16)}`;
}

function toFarmDisplayName(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toTitleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function toUserDisplayName(
  email: string,
  explicitDisplayName: string | null | undefined,
): string {
  const normalizedDisplayName = explicitDisplayName?.trim();
  if (normalizedDisplayName) {
    return normalizedDisplayName;
  }

  const localPart = email.split('@')[0] ?? '';
  const normalizedLocalPart = localPart
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalizedLocalPart) {
    return 'there';
  }

  return normalizedLocalPart.split(' ').map(toTitleCase).join(' ');
}

function toGreetingForNow(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function toGroupIconVariant(group: ProtectedNavigationGroupKey): ListRowIconVariant {
  if (group === 'operations') return 'green';
  if (group === 'commerce') return 'amber';
  return 'neutral';
}

export function DashboardShell({ email }: Props) {
  const router = useRouter();
  const { accessLoading, accessSnapshot, hasMenuAccess } = useAuth();
  const { snapshot, loading, refreshing, error, refresh } = useDashboardSnapshot();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const context = accessSnapshot.context;
  const farmDisplayName = useMemo(
    () => toFarmDisplayName(context?.farmName) ?? 'Farm workspace',
    [context?.farmName],
  );
  const hasFarmName = farmDisplayName !== 'Farm workspace';
  const userDisplayName = useMemo(
    () => toUserDisplayName(email, context?.displayName),
    [context?.displayName, email],
  );
  const greetingLabel = `${toGreetingForNow()}, ${userDisplayName}`;

  useFocusEffect(
    React.useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh]),
  );

  const availableModuleItems = useMemo(() => {
    return PROTECTED_NAVIGATION_ITEMS.filter((item) => {
      if (item.key === 'dashboard') return true;
      if (accessLoading) return true;
      return resolvePermissionKeys(item.menuKey).some((menuKey) => hasMenuAccess(menuKey));
    });
  }, [accessLoading, hasMenuAccess]);

  const overviewModuleItems = useMemo(
    () => availableModuleItems.filter((item) => item.key !== 'dashboard'),
    [availableModuleItems],
  );

  const groupedModuleItems = useMemo(() => {
    return PROTECTED_NAVIGATION_GROUPS.map((group) => ({
      ...group,
      items: availableModuleItems.filter((item) => item.group === group.key),
    })).filter((group) => group.items.length > 0);
  }, [availableModuleItems]);

  const overviewGroups = useMemo(
    () => groupedModuleItems.filter((group) => group.key !== 'overview'),
    [groupedModuleItems],
  );

  const snapshotPrimaryStats = useMemo(
    () => [
      { value: snapshot?.fieldsActive ?? 0, label: 'Active Fields', color: 'green' as const },
      {
        value: snapshot?.tasksTotal ?? 0,
        label: 'Tasks',
        color: (snapshot?.tasksTotal ?? 0) > 0 ? ('amber' as const) : ('green' as const),
      },
      {
        value: snapshot?.lowStockAlertsTotal ?? 0,
        label: 'Low Stock',
        color: (snapshot?.lowStockAlertsTotal ?? 0) > 0 ? ('red' as const) : ('green' as const),
      },
    ],
    [snapshot],
  );

  const snapshotSecondaryStats = useMemo(
    () => [
      { value: snapshot?.ordersTotal ?? 0, label: 'Orders', color: 'green' as const },
      { value: snapshot?.equipmentTotal ?? 0, label: 'Equipment', color: 'amber' as const },
      { value: snapshot?.contactsTotal ?? 0, label: 'Contacts', color: 'green' as const },
    ],
    [snapshot],
  );

  const quickActions = useMemo<QuickAction[]>(() => {
    const moduleShortcuts = overviewModuleItems.slice(0, 2).map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      color: item.group === 'commerce' ? ('amber' as const) : ('green' as const),
      onPress: () => router.push(item.href),
    }));
    const hasLogbookAccess = availableModuleItems.some((item) => item.key === 'crops');
    const logbookAction: QuickAction | null = hasLogbookAccess
      ? {
          key: 'logbook',
          icon: 'book-open-page-variant-outline',
          label: 'Logbook',
          color: 'green',
          onPress: () => router.push({ pathname: '/(protected)/crops', params: { tab: 'logbook' } }),
        }
      : null;

    return [
      {
        key: 'refresh',
        icon: 'refresh',
        label: 'Refresh',
        color: 'blue',
        onPress: () => void refresh(),
      },
      ...moduleShortcuts,
      ...(logbookAction ? [logbookAction] : []),
    ];
  }, [availableModuleItems, overviewModuleItems, refresh, router]);

  const profileCells = useMemo(
    () => [
      { label: 'Role', value: context?.role ?? 'n/a' },
      { label: 'Farm', value: hasFarmName ? farmDisplayName : 'n/a' },
      { label: 'Snapshot', value: toFetchedAtLabel(snapshot?.fetchedAt) },
    ],
    [context?.role, farmDisplayName, hasFarmName, snapshot?.fetchedAt],
  );

  function renderModuleBadge(item: (typeof PROTECTED_NAVIGATION_ITEMS)[number], active = false) {
    if (active) {
      return <AppBadge value="Now" variant="accent" />;
    }

    const badgeValue = item.getBadgeValue?.(snapshot) ?? null;
    if (badgeValue === null) return undefined;

    return (
      <AppBadge
        value={badgeValue}
        variant={typeof badgeValue === 'number' && badgeValue > 0 ? 'accent' : 'neutral'}
      />
    );
  }

  function renderSnapshotOverview() {
    if (loading && !snapshot) {
      return (
        <View style={styles.snapshotLoading}>
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      );
    }

    if (error && !snapshot) {
      return (
        <ErrorState
          title="Snapshot Unavailable"
          message={error}
          onRetry={() => void refresh()}
        />
      );
    }

    if (!snapshot) {
      return (
        <EmptyState
          title="No Snapshot Data"
          message="Dashboard snapshot is currently empty."
          actionLabel="Retry"
          onAction={() => void refresh()}
        />
      );
    }

    return (
      <>
        <StatStrip items={snapshotPrimaryStats} testID="dashboard-stats-primary" />
        <StatStrip items={snapshotSecondaryStats} testID="dashboard-stats-secondary" />
      </>
    );
  }

  function renderOverviewTab() {
    if (overviewGroups.length === 0) {
      return (
        <EmptyState
          title="No Modules Available"
          message="No protected modules are currently visible for this account."
        />
      );
    }

    return (
      <>
        {overviewGroups.map((group) => (
          <View key={group.key} style={styles.groupBlock}>
            <SectionHeader title={group.label} trailing={`${group.items.length} modules`} />
            {group.items.map((item) => (
              <ListRow
                key={item.key}
                icon={item.icon}
                iconVariant={toGroupIconVariant(item.group)}
                title={item.label}
                subtitle={item.getSubtitle(snapshot)}
                badge={renderModuleBadge(item)}
                onPress={() => router.push(item.href)}
                testID={`dashboard-overview-row-${item.key}`}
              />
            ))}
          </View>
        ))}
      </>
    );
  }

  function renderContextTab() {
    if (accessLoading) {
      return (
        <View style={styles.tabLoading}>
          <Skeleton height={52} />
          <Skeleton height={52} />
          <Skeleton height={52} />
        </View>
      );
    }

    if (!context) {
      return (
        <ErrorState
          title="Context Unavailable"
          message="Failed to load auth context snapshot."
        />
      );
    }

    return (
      <>
        <AppListItem title="Email" description={email} leftIcon="email-outline" />
        <AppListItem title="Role" description={context.role ?? 'n/a'} leftIcon="shield-account" />
        <AppListItem title="Type" description={context.type ?? 'n/a'} leftIcon="account-outline" />
        <AppListItem
          title="Farm"
          description={hasFarmName ? farmDisplayName : 'n/a'}
          leftIcon="map-marker"
        />
      </>
    );
  }

  function renderAccessTab() {
    return (
      <>
        <View style={styles.chipGrid}>
          <AppChip label="Dashboard Menu" selected={hasMenuAccess('dashboard')} />
          <AppChip label="RBAC Snapshot" selected={Boolean(accessSnapshot.rbac)} />
          <AppChip label="Entitlements Snapshot" selected={Boolean(accessSnapshot.entitlements)} />
          <AppChip label="Menu Snapshot" selected={Boolean(accessSnapshot.menus)} />
        </View>
        {groupedModuleItems.map((group) => (
          <View key={group.key} style={styles.groupBlock}>
            <SectionHeader title={group.label} trailing={`${group.items.length} modules`} />
            {group.items.map((item) => (
              <ListRow
                key={item.key}
                icon={item.icon}
                iconVariant={toGroupIconVariant(item.group)}
                title={item.label}
                subtitle={item.getSubtitle(snapshot)}
                badge={renderModuleBadge(item, item.key === 'dashboard')}
                accentBorder={item.key === 'dashboard'}
                onPress={() => router.push(item.href)}
                testID={`dashboard-access-row-${item.key}`}
              />
            ))}
          </View>
        ))}
      </>
    );
  }

  function renderActiveTabBody() {
    if (activeTab === 'overview') return renderOverviewTab();
    if (activeTab === 'context') return renderContextTab();
    return renderAccessTab();
  }

  return (
    <>
      <AppScreen padded={false}>
        <View style={styles.header}>
          <View style={styles.headerLead}>
            <HeaderMenuButton testID="dashboard-header-menu" />
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                {hasFarmName ? farmDisplayName : `Signed in as ${email}`}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <NotificationHeaderButton testID="dashboard-header-notifications" />
          </View>
        </View>

        <PullToRefreshContainer
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingTitle}>{greetingLabel}</Text>
            <Text style={styles.greetingSubtitle}>
              {hasFarmName ? farmDisplayName : `Signed in as ${email}`}
            </Text>
          </View>

          <ProfileCard
            icon="view-dashboard-outline"
            name={farmDisplayName}
            subtitle={`Signed in as ${email}`}
            cells={profileCells}
            testID="dashboard-profile-card"
          />

          <QuickActionGrid actions={quickActions} testID="dashboard-quick-actions" />

          <SectionHeader
            title="Live Snapshot"
            trailing={snapshot?.fetchedAt ? `Updated ${snapshot.fetchedAt.slice(11, 16)}` : undefined}
          />
          {renderSnapshotOverview()}

          <PillTabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as DashboardTab)}
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'context', label: 'Context' },
              { value: 'access', label: 'Access' },
            ]}
            testID="dashboard-tabs"
          />

          <SectionCard testID="dashboard-tab-card">
            {renderActiveTabBody()}
          </SectionCard>
        </PullToRefreshContainer>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: palette.background,
  },
  headerLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  headerTitle: {
    ...typography.title,
    color: palette.foreground,
  },
  headerSubtitle: {
    ...typography.caption,
    color: palette.mutedForeground,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  greetingBlock: {
    gap: spacing.xs,
  },
  greetingTitle: {
    ...typography.title,
    color: palette.foreground,
  },
  greetingSubtitle: {
    ...typography.body,
    color: palette.mutedForeground,
  },
  snapshotLoading: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tabLoading: {
    gap: spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  groupBlock: {
    gap: spacing.xs,
  },
});
