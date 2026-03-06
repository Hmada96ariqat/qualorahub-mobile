import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type DotBadgeVariant = 'success' | 'warning' | 'neutral' | 'destructive';

type DotBadgeProps = {
  label: string;
  variant?: DotBadgeVariant;
  testID?: string;
};

const VARIANT_STYLES: Record<DotBadgeVariant, { bg: string; fg: string; dot: string }> = {
  success: { bg: '#D8EFDD', fg: '#136C22', dot: '#2EB845' },
  warning: { bg: '#FFF3CC', fg: '#8B6914', dot: '#FFC61A' },
  neutral: { bg: '#EDF2F0', fg: '#677E73', dot: '#677E73' },
  destructive: { bg: '#FDECEC', fg: '#EF4343', dot: '#EF4343' },
};

export function DotBadge({ label, variant = 'neutral', testID }: DotBadgeProps) {
  const colors = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]} testID={testID}>
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.label, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
