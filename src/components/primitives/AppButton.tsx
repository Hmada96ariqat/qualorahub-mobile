import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { palette, radius, spacing, typography } from '../../theme/tokens';

type AppButtonTone = 'primary' | 'neutral' | 'destructive';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  tone?: AppButtonTone;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

export function AppButton({
  label,
  onPress,
  mode = 'contained',
  tone = 'primary',
  loading = false,
  disabled = false,
  testID,
}: AppButtonProps) {
  const buttonColor =
    mode === 'contained'
      ? tone === 'destructive'
        ? palette.destructive
        : tone === 'neutral'
          ? palette.secondary
          : palette.primary
      : undefined;
  const textColor =
    mode === 'contained'
      ? tone === 'destructive'
        ? palette.onDestructive
        : tone === 'neutral'
          ? palette.foreground
          : palette.onPrimary
      : tone === 'destructive'
        ? palette.destructive
        : palette.primaryDark;

  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      uppercase={false}
      buttonColor={buttonColor}
      textColor={textColor}
      style={[
        styles.button,
        mode === 'outlined' && tone === 'destructive' ? styles.destructiveOutline : null,
        mode === 'outlined' && tone === 'neutral' ? styles.neutralOutline : null,
      ]}
      labelStyle={styles.label}
      contentStyle={styles.content}
      testID={testID}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
  },
  content: {
    minHeight: 48,
    paddingHorizontal: spacing.xs,
  },
  label: {
    ...typography.button,
  },
  destructiveOutline: {
    borderColor: palette.destructive,
  },
  neutralOutline: {
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
});
