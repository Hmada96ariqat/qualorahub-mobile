import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';

export type ListRowIconVariant = 'green' | 'amber' | 'neutral';

type ListRowProps = {
  icon: string;
  iconVariant?: ListRowIconVariant;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  overdueLine?: string;
  accentBorder?: boolean;
  onPress?: () => void;
  testID?: string;
};

const ICON_COLORS: Record<ListRowIconVariant, { bg: string; fg: string }> = {
  green: { bg: '#D8EFDD', fg: '#136C22' },
  amber: { bg: '#FFF3CC', fg: '#8B6914' },
  neutral: { bg: '#EDF2F0', fg: '#677E73' },
};

export function ListRow({
  icon,
  iconVariant = 'green',
  title,
  subtitle,
  badge,
  overdueLine,
  accentBorder = false,
  onPress,
  testID,
}: ListRowProps) {
  const iconColors = ICON_COLORS[iconVariant];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        accentBorder && styles.accentBorder,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColors.bg }]}>
        <Icon source={icon} size={20} color={iconColors.fg} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.sub}>{subtitle}</Text>
        {overdueLine ? (
          <View style={styles.overdueRow}>
            <Icon source="alert-circle-outline" size={12} color={palette.destructive} />
            <Text style={styles.overdueText}>{overdueLine}</Text>
          </View>
        ) : null}
      </View>
      {badge}
      <Icon source="chevron-right" size={16} color={palette.border} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  accentBorder: {
    borderLeftWidth: 3,
    borderLeftColor: palette.destructive,
  },
  pressed: {
    backgroundColor: palette.muted,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.foreground,
  },
  sub: {
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: 1,
  },
  overdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.destructive,
  },
});
