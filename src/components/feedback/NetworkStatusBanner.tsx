import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppButton } from '../primitives/AppButton';
import { palette, spacing, typography } from '../../theme/tokens';

type NetworkStatusBannerProps = {
  isOnline: boolean | null;
  offlineMessage?: string;
  onlineMessage?: string;
  showOnlineRecovery?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function NetworkStatusBanner({
  isOnline,
  offlineMessage = 'You are offline. Some actions may be unavailable.',
  onlineMessage = 'Connection restored.',
  showOnlineRecovery = false,
  actionLabel,
  onAction,
  testID,
}: NetworkStatusBannerProps) {
  if (isOnline === null) return null;
  if (isOnline && !showOnlineRecovery) return null;

  const offline = isOnline === false;
  const message = offline ? offlineMessage : onlineMessage;

  return (
    <View
      style={[styles.container, offline ? styles.offline : styles.online]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel="Network status banner"
    >
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <AppButton
          label={actionLabel}
          mode="text"
          onPress={onAction}
          testID="network-status-banner.action"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  offline: {
    backgroundColor: '#FFF4D1',
  },
  online: {
    backgroundColor: '#DDF5E2',
  },
  message: {
    ...typography.body,
    color: palette.foreground,
    flex: 1,
  },
});
