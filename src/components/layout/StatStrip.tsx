import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../../theme/tokens';

export type StatItem = {
  value: number | string;
  label: string;
  color?: 'green' | 'amber' | 'red';
};

type StatStripProps = {
  items: StatItem[];
  testID?: string;
};

const COLOR_MAP: Record<string, string> = {
  green: '#136C22',
  amber: '#8B6914',
  red: '#EF4343',
};

export function StatStrip({ items, testID }: StatStripProps) {
  return (
    <View style={styles.row} testID={testID}>
      {items.map((item, index) => (
        <View key={index} style={styles.stat}>
          <Text style={[styles.num, { color: COLOR_MAP[item.color ?? 'green'] }]}>
            {item.value}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  stat: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 2,
  },
  num: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: palette.mutedForeground,
  },
});
