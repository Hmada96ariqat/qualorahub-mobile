import React from 'react';
import { StyleSheet } from 'react-native';
import { List, Text } from 'react-native-paper';
import { palette, radius, spacing, typography } from '../../theme/tokens';

type AppListItemProps = {
  title: string;
  description?: string;
  leftIcon?: string;
  rightText?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

export function AppListItem({
  title,
  description,
  leftIcon,
  rightText,
  onPress,
  accessibilityLabel,
  testID,
}: AppListItemProps) {
  return (
    <List.Item
      title={title}
      description={description}
      onPress={onPress}
      left={leftIcon ? (props) => <List.Icon {...props} icon={leftIcon} /> : undefined}
      right={rightText ? () => <Text style={styles.rightText}>{rightText}</Text> : undefined}
      style={styles.item}
      titleStyle={styles.title}
      descriptionStyle={styles.description}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? title}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: 52,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  title: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  description: {
    ...typography.body,
    color: palette.mutedForeground,
  },
  rightText: {
    ...typography.caption,
    color: palette.mutedForeground,
    textTransform: 'capitalize',
    alignSelf: 'center',
    marginRight: spacing.xs,
  },
});
