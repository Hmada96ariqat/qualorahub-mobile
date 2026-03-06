import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/tokens';

export type PillTabOption = {
  value: string;
  label: string;
};

type PillTabsProps = {
  value: string;
  tabs: PillTabOption[];
  onValueChange: (value: string) => void;
  testID?: string;
};

export function PillTabs({ value, tabs, onValueChange, testID }: PillTabsProps) {
  return (
    <View style={styles.container} testID={testID}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onValueChange(tab.value)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: palette.muted,
    borderRadius: 9999,
    padding: 3,
    marginBottom: 14,
  },
  pill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: palette.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.mutedForeground,
    textAlign: 'center',
  },
  labelActive: {
    color: palette.foreground,
  },
});
