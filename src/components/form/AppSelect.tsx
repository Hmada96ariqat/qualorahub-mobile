import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';
import { AppButton } from '../primitives/AppButton';
import { palette, spacing, typography } from '../../theme/tokens';
import { AppInput } from '../primitives/AppInput';

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
  searchable?: boolean;
  searchPlaceholder?: string;
  maxListHeight?: number;
  createOptionLabel?: string;
  onCreateOption?: () => void;
  testID?: string;
};

export function AppSelect({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  label = 'Select',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search options',
  maxListHeight = 280,
  createOptionLabel = 'Create new',
  onCreateOption,
  testID,
}: AppSelectProps) {
  const [visible, setVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value);
    return selected?.label ?? placeholder;
  }, [options, value, placeholder]);

  const filteredOptions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return options;

    return options.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  }, [options, searchValue]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setSearchValue('');
    setVisible(false);
  }

  function handleDismiss() {
    setSearchValue('');
    setVisible(false);
  }

  function handleCreateOption() {
    handleDismiss();
    onCreateOption?.();
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
        <Dialog visible={visible} onDismiss={handleDismiss}>
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogContent}>
              {searchable ? (
                <AppInput
                  value={searchValue}
                  onChangeText={setSearchValue}
                  placeholder={searchPlaceholder}
                  autoCapitalize="none"
                  accessibilityLabel={`${label} search`}
                  testID={testID ? `${testID}.search` : undefined}
                />
              ) : null}
              {onCreateOption ? (
                <AppButton
                  label={createOptionLabel}
                  mode="outlined"
                  tone="primary"
                  onPress={handleCreateOption}
                  testID={testID ? `${testID}.create-option` : undefined}
                />
              ) : null}
              <ScrollView
                style={[styles.optionsScroll, { maxHeight: maxListHeight }]}
                contentContainerStyle={styles.options}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                testID={testID ? `${testID}.options-scroll` : undefined}
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
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
                  ))
                ) : (
                  <Text style={styles.emptyState}>No options found.</Text>
                )}
              </ScrollView>
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
    paddingBottom: spacing.xs,
  },
  optionsScroll: {
    width: '100%',
  },
  dialogContent: {
    gap: spacing.sm,
  },
  optionRow: {
    minHeight: 46,
  },
  caption: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  emptyState: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
});
