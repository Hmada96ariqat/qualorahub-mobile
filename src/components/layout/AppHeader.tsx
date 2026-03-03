import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme/tokens';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  testID?: string;
};

export function AppHeader({ title, subtitle, rightAction, testID }: AppHeaderProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View style={styles.action}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: palette.foreground,
  },
  subtitle: {
    ...typography.subtitle,
    color: palette.mutedForeground,
    fontWeight: '500',
  },
  action: {
    alignItems: 'flex-end',
  },
});
