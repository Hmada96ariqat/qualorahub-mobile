import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette, spacing, typography } from '../../../../theme/tokens';

type CropsFactRowProps = {
  label: string;
  value: string;
};

export function CropsFactRow({ label, value }: CropsFactRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  value: {
    ...typography.body,
    color: palette.foreground,
    flex: 1,
    textAlign: 'right',
  },
});
