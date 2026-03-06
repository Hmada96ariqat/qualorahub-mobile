import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing, typography } from '../../theme/tokens';

export type ModuleTabOption<T extends string = string> = {
  value: T;
  label: string;
};

type ModuleTabsProps<T extends string = string> = {
  tabs: readonly ModuleTabOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  testID?: string;
};

export function ModuleTabs<T extends string>({
  tabs,
  value,
  onValueChange,
  testID,
}: ModuleTabsProps<T>) {
  return (
    <View style={styles.shell} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {tabs.map((tab) => {
          const active = tab.value === value;

          return (
            <Pressable
              key={tab.value}
              onPress={() => onValueChange(tab.value)}
              style={({ pressed }) => [
                styles.tab,
                active ? styles.tabActive : styles.tabInactive,
                pressed ? styles.tabPressed : null,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              testID={testID ? `${testID}.${tab.value}` : undefined}
            >
              <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.muted,
    overflow: 'hidden',
  },
  content: {
    padding: 3,
    gap: 2,
  },
  tab: {
    minWidth: 110,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#D8EFDD',
  },
  tabInactive: {
    backgroundColor: palette.surface,
  },
  tabPressed: {
    opacity: 0.86,
  },
  label: {
    ...typography.button,
    textAlign: 'center',
  },
  labelActive: {
    color: palette.primaryDark,
  },
  labelInactive: {
    color: palette.mutedForeground,
  },
});
