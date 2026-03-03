import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { palette, radius, typography } from '../../theme/tokens';

export type AppTabOption = {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
};

type AppTabsProps = {
  value: string;
  tabs: AppTabOption[];
  onValueChange: (value: string) => void;
  testID?: string;
};

export function AppTabs({ value, tabs, onValueChange, testID }: AppTabsProps) {
  return (
    <View style={styles.container} testID={testID}>
      <SegmentedButtons
        value={value}
        onValueChange={onValueChange}
        style={styles.segmented}
        buttons={tabs.map((tab) => ({
          value: tab.value,
          label: tab.label,
          icon: tab.icon,
          disabled: tab.disabled,
          checkedColor: palette.primaryDark,
          uncheckedColor: palette.mutedForeground,
          style: [styles.button, value === tab.value ? styles.buttonActive : styles.buttonInactive],
          labelStyle: styles.label,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  segmented: {
    backgroundColor: palette.muted,
  },
  button: {
    minHeight: 44,
  },
  buttonActive: {
    backgroundColor: '#D8EFDD',
    borderColor: palette.ring,
  },
  buttonInactive: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  label: {
    ...typography.button,
  },
});
