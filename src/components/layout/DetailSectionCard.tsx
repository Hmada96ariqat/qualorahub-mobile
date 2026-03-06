import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette, radius, spacing, typography } from '../../theme/tokens';

type DetailSectionCardProps = {
  title: string;
  description?: string;
  trailing?: ReactNode;
  children: ReactNode;
  testID?: string;
};

export function DetailSectionCard({
  title,
  description,
  trailing,
  children,
  testID,
}: DetailSectionCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  description: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  trailing: {
    alignItems: 'flex-end',
  },
  content: {
    gap: spacing.sm,
  },
});
