import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';
import { AppButton } from '../primitives/AppButton';
import { palette, spacing, typography } from '../../theme/tokens';

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type AppDatePickerProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  testID?: string;
};

export function AppDatePicker({
  value,
  onChange,
  label = 'Select date',
  placeholder = 'No date selected',
  disabled = false,
  testID,
}: AppDatePickerProps) {
  const [visible, setVisible] = useState(false);

  const dateText = useMemo(() => value ?? placeholder, [value, placeholder]);

  function selectOffset(days: number) {
    const selected = new Date();
    selected.setDate(selected.getDate() + days);
    onChange(formatIsoDate(selected));
    setVisible(false);
  }

  function clearDate() {
    onChange(null);
    setVisible(false);
  }

  return (
    <View style={styles.container} testID={testID}>
      <AppButton
        label={dateText}
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
              <AppButton label="Today" mode="outlined" tone="neutral" onPress={() => selectOffset(0)} />
              <AppButton label="Tomorrow" mode="outlined" tone="neutral" onPress={() => selectOffset(1)} />
              <AppButton label="In 7 days" mode="outlined" tone="neutral" onPress={() => selectOffset(7)} />
              <AppButton label="Clear date" mode="text" tone="destructive" onPress={clearDate} />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Text style={styles.caption}>Choose a preset date for now.</Text>
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
  caption: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
});
