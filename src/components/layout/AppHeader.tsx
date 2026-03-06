import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme/tokens';
import { HeaderMenuButton } from './HeaderMenuButton';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  hideMenuButton?: boolean;
  menuButtonTestID?: string;
  testID?: string;
};

export function AppHeader({
  title,
  subtitle,
  rightAction,
  leftAction,
  hideMenuButton = false,
  menuButtonTestID,
  testID,
}: AppHeaderProps) {
  const resolvedLeftAction =
    leftAction ??
    (hideMenuButton ? null : <HeaderMenuButton testID={menuButtonTestID ?? 'app-header.menu'} />);

  return (
    <View style={styles.container} testID={testID}>
      {resolvedLeftAction ? <View style={styles.leading}>{resolvedLeftAction}</View> : null}
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
  leading: {
    paddingTop: 2,
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
