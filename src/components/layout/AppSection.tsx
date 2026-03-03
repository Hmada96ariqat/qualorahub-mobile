import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme/tokens';

type AppSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  testID?: string;
};

export function AppSection({ title, description, children, footer, testID }: AppSectionProps) {
  return (
    <View style={styles.container} testID={testID}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
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
  body: {
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.xs,
  },
});
