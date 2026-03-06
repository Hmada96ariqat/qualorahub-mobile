import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';
import { AppButton } from '../primitives/AppButton';
import { palette, spacing, typography } from '../../theme/tokens';

const PICK_A_DATE_LABEL = 'Pick a date';

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatIsoDate(date: Date): string {
  const normalized = normalizeDate(date);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, '0');
  const day = String(normalized.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return normalizeDate(parsed);
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return normalizeDate(next);
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
  label = PICK_A_DATE_LABEL,
  placeholder = PICK_A_DATE_LABEL,
  disabled = false,
  testID,
}: AppDatePickerProps) {
  const [visible, setVisible] = useState(false);
  const resolvedDate = useMemo(
    () => parseIsoDate(value) ?? normalizeDate(new Date()),
    [value],
  );
  const [draftDate, setDraftDate] = useState<Date>(resolvedDate);

  useEffect(() => {
    if (!visible) {
      setDraftDate(resolvedDate);
    }
  }, [resolvedDate, visible]);

  const dateText = useMemo(() => value ?? placeholder, [value, placeholder]);

  function closeDialog() {
    setDraftDate(resolvedDate);
    setVisible(false);
  }

  function openAndroidPicker() {
    DateTimePickerAndroid.open({
      value: resolvedDate,
      mode: 'date',
      design: 'material',
      initialInputMode: 'default',
      title: PICK_A_DATE_LABEL,
      positiveButton: { label: 'Confirm' },
      negativeButton: { label: 'Cancel' },
      neutralButton: { label: 'Clear date' },
      onChange: (event, selectedDate) => {
        if (event.type === 'neutralButtonPressed') {
          onChange(null);
          return;
        }

        if (event.type === 'set' && selectedDate) {
          onChange(formatIsoDate(selectedDate));
        }
      },
    });
  }

  function openPicker() {
    if (disabled) return;

    if (Platform.OS === 'android') {
      openAndroidPicker();
      return;
    }

    setDraftDate(resolvedDate);
    setVisible(true);
  }

  function selectOffset(days: number) {
    setDraftDate(addDays(normalizeDate(new Date()), days));
  }

  function applyDate() {
    onChange(formatIsoDate(draftDate));
    setVisible(false);
  }

  function clearDate() {
    onChange(null);
    setVisible(false);
  }

  function handleNativeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (event.type === 'set' && selectedDate) {
      setDraftDate(normalizeDate(selectedDate));
    }
  }

  return (
    <View style={styles.container} testID={testID}>
      <AppButton
        label={dateText}
        mode="outlined"
        tone="neutral"
        onPress={openPicker}
        disabled={disabled}
        testID={testID ? `${testID}.trigger` : undefined}
      />

      {Platform.OS === 'android' ? null : (
        <Portal>
          <Dialog visible={visible} onDismiss={closeDialog}>
            <Dialog.Title>{PICK_A_DATE_LABEL}</Dialog.Title>
            <Dialog.Content>
              <View style={styles.content}>
                <View style={styles.shortcutRow}>
                  <View style={styles.shortcutButton}>
                    <AppButton
                      label="Today"
                      mode="outlined"
                      tone="neutral"
                      onPress={() => selectOffset(0)}
                      testID={testID ? `${testID}.shortcut-today` : undefined}
                    />
                  </View>
                  <View style={styles.shortcutButton}>
                    <AppButton
                      label="Tomorrow"
                      mode="outlined"
                      tone="neutral"
                      onPress={() => selectOffset(1)}
                      testID={testID ? `${testID}.shortcut-tomorrow` : undefined}
                    />
                  </View>
                </View>

                <View style={styles.selectedState}>
                  <Text style={styles.selectedLabel}>{label}</Text>
                  <Text style={styles.selectedValue}>{formatIsoDate(draftDate)}</Text>
                </View>

                <View style={styles.pickerWrap}>
                  <DateTimePicker
                    value={draftDate}
                    mode="date"
                    display="spinner"
                    onChange={handleNativeChange}
                    accentColor={palette.primary}
                    themeVariant="light"
                    testID={testID ? `${testID}.native` : undefined}
                  />
                </View>
              </View>
            </Dialog.Content>
            <Dialog.Actions style={styles.actions}>
              <View style={styles.actionsRow}>
                <View style={styles.actionButton}>
                  <AppButton
                    label="Clear date"
                    mode="text"
                    tone="destructive"
                    onPress={clearDate}
                    testID={testID ? `${testID}.clear` : undefined}
                  />
                </View>
                <View style={styles.actionButton}>
                  <AppButton
                    label="Cancel"
                    mode="text"
                    tone="neutral"
                    onPress={closeDialog}
                    testID={testID ? `${testID}.cancel` : undefined}
                  />
                </View>
                <View style={styles.actionButton}>
                  <AppButton
                    label="Apply"
                    onPress={applyDate}
                    testID={testID ? `${testID}.apply` : undefined}
                  />
                </View>
              </View>
              <Text style={styles.caption}>Use the picker or a shortcut, then apply.</Text>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  content: {
    gap: spacing.sm,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  shortcutButton: {
    flex: 1,
  },
  selectedState: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  selectedLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  selectedValue: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  pickerWrap: {
    alignItems: 'center',
    backgroundColor: palette.surfaceVariant,
    borderRadius: 16,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  caption: {
    ...typography.caption,
    color: palette.mutedForeground,
    width: '100%',
  },
});
