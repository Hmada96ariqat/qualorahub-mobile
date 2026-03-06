import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/tokens';

export type UnderlineTabOption = {
  value: string;
  label: string;
};

type UnderlineTabsProps = {
  value: string;
  tabs: UnderlineTabOption[];
  onValueChange: (value: string) => void;
  testID?: string;
};

export function UnderlineTabs({ value, tabs, onValueChange, testID }: UnderlineTabsProps) {
  return (
    <View style={styles.container} testID={testID}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onValueChange(tab.value)}
            style={styles.tab}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            {active && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: palette.border,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.mutedForeground,
  },
  labelActive: {
    color: palette.primary,
  },
  indicator: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: palette.primary,
    borderRadius: 1,
  },
});
