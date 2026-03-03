import React from 'react';
import { StyleSheet } from 'react-native';
import { Badge } from 'react-native-paper';
import { palette } from '../../theme/tokens';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'destructive';

type AppBadgeProps = {
  value: string | number;
  variant?: BadgeVariant;
  visible?: boolean;
  size?: number;
  testID?: string;
  accessibilityLabel?: string;
};

export function AppBadge({
  value,
  variant = 'neutral',
  visible = true,
  size,
  testID,
  accessibilityLabel,
}: AppBadgeProps) {
  return (
    <Badge
      visible={visible}
      size={size}
      style={[styles.base, BADGE_VARIANT_STYLES[variant]]}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? `Badge ${value}`}
    >
      {value}
    </Badge>
  );
}

const styles = StyleSheet.create({
  base: {
    color: palette.foreground,
  },
});

const BADGE_VARIANT_STYLES: Record<BadgeVariant, { backgroundColor: string; color: string }> = {
  neutral: { backgroundColor: palette.muted, color: palette.foreground },
  accent: { backgroundColor: palette.accent, color: palette.onAccent },
  success: { backgroundColor: palette.success, color: palette.onSuccess },
  warning: { backgroundColor: palette.warning, color: palette.onWarning },
  destructive: { backgroundColor: palette.destructive, color: palette.onDestructive },
};
