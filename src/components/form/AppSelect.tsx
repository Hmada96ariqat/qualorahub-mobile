import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';
import { AppButton } from '../primitives/AppButton';
import { palette, spacing, typography } from '../../theme/tokens';

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type AppSelectProps = {
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  testID?: string;
};

export function AppSelect({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  label = 'Select',
  disabled = false,
  testID,
}: AppSelectProps) {
  const [visible, setVisible] = useState(false);

  const selectedLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value);
    return selected?.label ?? placeholder;
  }, [options, value, placeholder]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setVisible(false);
  }

  return (
    <View style={styles.container} testID={testID}>
      <AppButton
        label={selectedLabel}
        mode="outlined"
        tone="neutral"
        onPress={() => setVisible(true)}
        disabled={disabled}
      />

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.options}>
              {options.map((option) => (
                <View key={option.value} style={styles.optionRow}>
                  <AppButton
                    label={option.label}
                    mode={option.value === value ? 'contained' : 'outlined'}
                    tone={option.value === value ? 'primary' : 'neutral'}
                    onPress={() => handleSelect(option.value)}
                    disabled={Boolean(option.disabled)}
                    testID={`app-select-option-${option.value}`}
                  />
                </View>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Text style={styles.caption}>Tap an option to confirm selection.</Text>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  options: {
    gap: spacing.sm,
  },
  optionRow: {
    minHeight: 46,
  },
  caption: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
});
