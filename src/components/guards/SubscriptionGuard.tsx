import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { spacing, palette, typography } from '../../theme/tokens';

type SubscriptionGuardProps = {
  children: React.ReactNode;
  /** Optional callback when user wants to view billing/subscription info */
  onViewSubscription?: () => void;
};

/**
 * Wraps protected content and enforces subscription expiry modes:
 *
 * - hard_block: Shows full-screen overlay blocking all access
 * - read_only: Renders children but shows a banner at the top
 * - limited_access: Renders children (module-level checks happen elsewhere)
 * - active: Renders children normally
 */
export function SubscriptionGuard({ children, onViewSubscription }: SubscriptionGuardProps) {
  const { loading, isHardBlocked, isReadOnly } = useSubscriptionGuard();

  if (loading) {
    return <>{children}</>;
  }

  if (isHardBlocked) {
    return (
      <View style={styles.blockedContainer} testID="subscription-hard-block-overlay">
        <View style={styles.blockedCard}>
          <Text style={styles.blockedTitle}>Subscription Expired</Text>
          <Text style={styles.blockedMessage}>
            Your subscription has expired. Please renew your subscription to continue using
            QualoraHub.
          </Text>
          {onViewSubscription ? (
            <Text
              style={styles.blockedLink}
              onPress={onViewSubscription}
            >
              View Subscription Details
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isReadOnly ? (
        <View style={styles.readOnlyBanner} testID="subscription-read-only-banner">
          <Text style={styles.readOnlyText}>
            Your subscription is in read-only mode. You can view data but cannot make changes.
          </Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

export { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: palette.background,
  },
  blockedCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  blockedTitle: {
    fontSize: typography.title.fontSize,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
    color: palette.foreground,
  },
  blockedMessage: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    color: palette.mutedForeground,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  blockedLink: {
    fontSize: typography.body.fontSize,
    color: palette.primary,
    fontWeight: '500',
  },
  readOnlyBanner: {
    backgroundColor: '#FFF3E0',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  readOnlyText: {
    fontSize: 12,
    color: '#E65100',
    textAlign: 'center',
  },
});
