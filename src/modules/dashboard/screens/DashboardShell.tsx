import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from 'react-native-paper';
import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppCard,
  AppChip,
  AppHeader,
  AppListItem,
  AppScreen,
  AppSection,
  AppTabs,
  EmptyState,
  ErrorState,
  PullToRefreshContainer,
  SectionCard,
  Skeleton,
} from '../../../components';
import { palette, spacing, typography } from '../../../theme/tokens';
import { useAuth } from '../../../providers/AuthProvider';
import { useDashboardSnapshot } from '../useDashboardSnapshot.hook';

type Props = {
  email: string;
  onSignOut: () => void;
};

export function DashboardShell({ email, onSignOut }: Props) {
  const router = useRouter();
  const { accessLoading, accessSnapshot, hasMenuAccess } = useAuth();
  const { snapshot, loading, refreshing, error, refresh } = useDashboardSnapshot();
  const [tab, setTab] = useState('context');
  const context = accessSnapshot.context;
  const loadedSnapshotCount = useMemo(
    () =>
      [accessSnapshot.context, accessSnapshot.rbac, accessSnapshot.entitlements, accessSnapshot.menus].filter(
        Boolean,
      ).length,
    [accessSnapshot],
  );
  const snapshotCards = useMemo(
    () => [
      {
        title: 'Fields',
        value: snapshot?.fieldsTotal ?? 0,
        detail: `${snapshot?.fieldsActive ?? 0} active / ${snapshot?.fieldsInactive ?? 0} inactive`,
      },
      {
        title: 'Lots',
        value: snapshot?.lotsTotal ?? 0,
        detail: `${snapshot?.lotsActive ?? 0} active / ${snapshot?.lotsInactive ?? 0} inactive`,
      },
      {
        title: 'Orders',
        value: snapshot?.ordersTotal ?? 0,
        detail: `${snapshot?.lowStockAlertsTotal ?? 0} low-stock alerts`,
      },
      {
        title: 'Inventory',
        value: snapshot?.inventoryRowsTotal ?? 0,
        detail: `${snapshot?.productsTotal ?? 0} products tracked`,
      },
      {
        title: 'Operations',
        value: snapshot?.productionCyclesTotal ?? 0,
        detail: `${snapshot?.tasksTotal ?? 0} tasks queued`,
      },
      {
        title: 'People',
        value: snapshot?.contactsTotal ?? 0,
        detail: `${snapshot?.equipmentTotal ?? 0} equipment records`,
      },
    ],
    [snapshot],
  );
  useFocusEffect(
    React.useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh]),
  );

  function renderContextState() {
    if (accessLoading) {
      return (
        <>
          <Skeleton height={16} />
          <Skeleton height={16} width="72%" />
          <Skeleton height={16} width="48%" />
        </>
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
        <AppListItem
          title="Role"
          description={context.role ?? 'n/a'}
          leftIcon="shield-account"
        />
        <AppListItem
          title="Type"
          description={context.type ?? 'n/a'}
          leftIcon="account-outline"
        />
        <AppListItem
          title="Farm"
          description={context.farmId ?? 'n/a'}
          leftIcon="map-marker"
        />
      </>
    );
  }

  function renderSnapshotSection() {
    if (loading && !snapshot) {
      return (
        <View style={styles.kpiGrid}>
          <Skeleton height={88} />
          <Skeleton height={88} />
          <Skeleton height={88} />
          <Skeleton height={88} />
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
      <View style={styles.kpiGrid}>
        {snapshotCards.map((card) => (
          <View key={card.title} style={styles.kpiCard}>
            <AppCard>
              <Text style={styles.kpiTitle}>{card.title}</Text>
              <Text style={styles.kpiValue}>{card.value}</Text>
              <Text style={styles.kpiDetail}>{card.detail}</Text>
            </AppCard>
          </View>
        ))}
      </View>
    );
  }

  return (
    <AppScreen padded={false}>
      <AppHeader
        title="Dashboard"
        subtitle={`Signed in as ${email}`}
      />

      <PullToRefreshContainer
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topActions}>
          <View style={styles.primaryAction}>
            <AppButton
              label="Refresh"
              onPress={() => void refresh()}
              loading={refreshing}
            />
          </View>
          <View style={styles.secondaryAction}>
            <AppButton
              label="Sign Out"
              mode="outlined"
              tone="destructive"
              onPress={onSignOut}
            />
          </View>
        </View>

        <SectionCard>
          <View style={styles.identityRow}>
            <AppAvatar
              label={email}
              size={48}
            />
            <View style={styles.identityMeta}>
              <Text style={styles.identityLabel}>{email}</Text>
              <View style={styles.badgeRow}>
                <Text style={styles.badgeLabel}>Loaded snapshots</Text>
                <AppBadge value={loadedSnapshotCount} variant="accent" />
              </View>
            </View>
          </View>

          <AppSection
            title="Snapshot KPIs"
            description="Data from /dashboard/snapshot with focus-refresh and pull-to-refresh support."
          >
            {renderSnapshotSection()}
          </AppSection>

          <AppTabs
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: 'context', label: 'Context' },
              { value: 'access', label: 'Access' },
            ]}
          />

          <AppSection
            title={tab === 'context' ? 'Auth Context' : 'Access Signals'}
            description={
              tab === 'context'
                ? 'Role and farm context loaded from /auth/context'
                : 'RBAC, entitlement, and menu snapshots loaded for this session'
            }
          >
            {tab === 'context' ? renderContextState() : null}
            {tab === 'access' ? (
              <View style={styles.chipGrid}>
                <AppChip label="Dashboard Menu" selected={hasMenuAccess('dashboard')} />
                <AppChip label="RBAC Snapshot" selected={Boolean(accessSnapshot.rbac)} />
                <AppChip label="Entitlements Snapshot" selected={Boolean(accessSnapshot.entitlements)} />
                <AppChip label="Menu Snapshot" selected={Boolean(accessSnapshot.menus)} />
              </View>
            ) : null}
          </AppSection>

          <AppSection
            title="Module Shortcuts"
            description="Phase 4 through Phase 13 active module routes."
          >
            <View style={styles.shortcuts}>
              <AppButton
                label="Open Fields"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/fields')}
              />
              <AppButton
                label="Open Lots"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/lots')}
              />
              <AppButton
                label="Open Tasks"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/tasks')}
              />
              <AppButton
                label="Open Equipment"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/equipment')}
              />
              <AppButton
                label="Open Finance"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/finance')}
              />
              <AppButton
                label="Open Inventory"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/inventory')}
              />
              <AppButton
                label="Open Orders"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/orders')}
              />
              <AppButton
                label="Open Crops"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/crops')}
              />
              <AppButton
                label="Open Livestock"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/livestock')}
              />
              <AppButton
                label="Open Management"
                mode="outlined"
                tone="neutral"
                onPress={() => router.push('/(protected)/management')}
              />
            </View>
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
    alignItems: 'center',
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    minWidth: 130,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identityMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  identityLabel: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    width: '48%',
    minWidth: 150,
  },
  kpiTitle: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  kpiValue: {
    ...typography.title,
    color: palette.foreground,
  },
  kpiDetail: {
    ...typography.body,
    color: palette.mutedForeground,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
