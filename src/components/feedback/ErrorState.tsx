import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppButton } from '../primitives/AppButton';
import { palette, spacing, typography } from '../../theme/tokens';

type ErrorStateProps = {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  testID?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try again',
  onRetry,
  testID,
}: ErrorStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton label={retryLabel} onPress={onRetry} mode="outlined" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: {
    ...typography.subtitle,
    color: palette.destructive,
  },
  message: {
    ...typography.body,
    color: palette.mutedForeground,
    textAlign: 'center',
  },
});
