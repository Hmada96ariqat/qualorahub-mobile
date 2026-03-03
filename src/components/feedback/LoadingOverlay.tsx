import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Portal, Text } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme/tokens';

type LoadingOverlayProps = {
  visible: boolean;
  label?: string;
  testID?: string;
};

export function LoadingOverlay({
  visible,
  label = 'Loading...',
  testID,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.backdrop} testID={testID}>
        <View style={styles.card}>
          <ActivityIndicator />
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 38, 31, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: palette.foreground,
  },
});
