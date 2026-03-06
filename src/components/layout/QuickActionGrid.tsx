import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';

export type QuickAction = {
  key: string;
  icon: string;
  label: string;
  color?: 'green' | 'amber' | 'blue' | 'red';
  onPress: () => void;
};

type QuickActionGridProps = {
  actions: QuickAction[];
  testID?: string;
};

const QA_COLORS: Record<string, { bg: string; fg: string }> = {
  green: { bg: '#D8EFDD', fg: '#136C22' },
  amber: { bg: '#FFF3CC', fg: '#8B6914' },
  blue: { bg: '#E8F4FD', fg: '#1976D2' },
  red: { bg: '#FDECEC', fg: '#EF4343' },
};

export function QuickActionGrid({ actions, testID }: QuickActionGridProps) {
  return (
    <View style={styles.row} testID={testID}>
      {actions.map((action) => {
        const colors = QA_COLORS[action.color ?? 'green'];
        return (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={({ pressed }) => [styles.qa, pressed && styles.qaPressed]}
          >
            <View style={[styles.qaIcon, { backgroundColor: colors.bg }]}>
              <Icon source={action.icon} size={16} color={colors.fg} />
            </View>
            <Text style={styles.qaLabel}>{action.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  qa: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
  },
  qaPressed: {
    backgroundColor: palette.muted,
  },
  qaIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.foreground,
  },
});
