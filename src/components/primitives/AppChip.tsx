import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { palette, radius, typography } from '../../theme/tokens';

type AppChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export function AppChip({
  label,
  selected = false,
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
}: AppChipProps) {
  return (
    <Chip
      selected={selected}
      onPress={onPress}
      disabled={disabled}
      showSelectedCheck={false}
      compact={false}
      selectedColor={palette.primaryDark}
      style={[styles.chip, selected ? styles.selected : styles.unselected]}
      textStyle={styles.label}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    borderRadius: radius.md,
  },
  selected: {
    backgroundColor: '#D8EFDD',
    borderColor: palette.ring,
  },
  unselected: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  label: {
    ...typography.button,
  },
});
