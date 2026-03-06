import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../../theme/tokens';

export type LogChip = {
  label: string;
  value: string;
  valueColor?: string;
};

type LogRowProps = {
  title: string;
  date: string;
  chips?: LogChip[];
  onPress?: () => void;
  testID?: string;
};

export function LogRow({ title, date, chips, onPress, testID }: LogRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && onPress ? styles.pressed : null]}
      testID={testID}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      {chips && chips.length > 0 && (
        <View style={styles.chips}>
          {chips.map((chip, index) => (
            <Text key={index} style={styles.chip}>
              {chip.label}:{' '}
              <Text style={[styles.chipValue, chip.valueColor ? { color: chip.valueColor } : null]}>
                {chip.value}
              </Text>
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  pressed: {
    backgroundColor: palette.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.foreground,
  },
  date: {
    fontSize: 11,
    color: palette.mutedForeground,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    fontSize: 11,
    color: palette.mutedForeground,
  },
  chipValue: {
    fontWeight: '600',
    color: palette.foreground,
  },
});
