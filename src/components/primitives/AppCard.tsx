import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { palette, radius, spacing } from '../../theme/tokens';

type AppCardProps = {
  children: ReactNode;
  testID?: string;
};

export function AppCard({ children, testID }: AppCardProps) {
  return (
    <Card mode="outlined" style={styles.card} testID={testID}>
      <Card.Content style={styles.content}>{children}</Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  content: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
