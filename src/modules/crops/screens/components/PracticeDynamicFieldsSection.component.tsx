import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  AppDatePicker,
  AppInput,
  AppSelect,
  AppTextArea,
  DetailSectionCard,
  FormField,
} from '../../../../components';
import { getDynamicFieldsForPractice } from '../../logbook/practiceConfig';
import { palette, spacing, typography } from '../../../../theme/tokens';

type PracticeDynamicFieldsSectionProps = {
  practiceCode: string | null | undefined;
  values: Record<string, string>;
  onValuesChange: (values: Record<string, string>) => void;
  title?: string;
  description?: string;
  requiredKeys?: string[];
  fieldErrors?: Record<string, string>;
  sectionError?: string | null;
};

export function PracticeDynamicFieldsSection({
  practiceCode,
  values,
  onValuesChange,
  title = 'Practice-specific fields',
  description = 'Complete the configured fields for this practice.',
  requiredKeys = [],
  fieldErrors = {},
  sectionError = null,
}: PracticeDynamicFieldsSectionProps) {
  const fields = useMemo(
    () => getDynamicFieldsForPractice(practiceCode),
    [practiceCode],
  );
  const requiredKeySet = useMemo(() => new Set(requiredKeys), [requiredKeys]);

  if (fields.length === 0) {
    return null;
  }

  function updateValue(key: string, nextValue: string) {
    onValuesChange({
      ...values,
      [key]: nextValue,
    });
  }

  return (
    <DetailSectionCard title={title} description={description}>
      {fields.map((field) => {
        const currentValue = values[field.key] ?? '';
        const errorText = fieldErrors[field.key];
        const required = requiredKeySet.has(field.key);

        if (field.type === 'textarea') {
          return (
            <FormField
              key={field.key}
              label={field.label}
              required={required}
              errorText={errorText}
            >
              <AppTextArea
                value={currentValue}
                onChangeText={(nextValue) => updateValue(field.key, nextValue)}
                placeholder={field.placeholder}
                error={Boolean(errorText)}
                numberOfLines={4}
              />
            </FormField>
          );
        }

        if (field.type === 'select') {
          return (
            <FormField
              key={field.key}
              label={field.label}
              required={required}
              errorText={errorText}
            >
              <AppSelect
                value={currentValue || null}
                options={field.options ?? []}
                onChange={(nextValue) => updateValue(field.key, nextValue)}
                placeholder={field.placeholder ?? `Select ${field.label}`}
                label={field.label}
                searchable={(field.options?.length ?? 0) > 6}
              />
            </FormField>
          );
        }

        if (field.type === 'date') {
          return (
            <FormField
              key={field.key}
              label={field.label}
              required={required}
              errorText={errorText}
            >
              <AppDatePicker
                value={currentValue || null}
                onChange={(nextValue) => updateValue(field.key, nextValue ?? '')}
                label={field.label}
                placeholder={field.placeholder ?? 'Pick a date'}
              />
            </FormField>
          );
        }

        return (
          <FormField
            key={field.key}
            label={field.label}
            required={required}
            errorText={errorText}
          >
            <AppInput
              value={currentValue}
              onChangeText={(nextValue) => updateValue(field.key, nextValue)}
              placeholder={field.placeholder}
              keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
              error={Boolean(errorText)}
            />
          </FormField>
        );
      })}

      {sectionError ? (
        <View style={styles.sectionError}>
          <Text style={styles.sectionErrorText}>{sectionError}</Text>
        </View>
      ) : null}
    </DetailSectionCard>
  );
}

const styles = StyleSheet.create({
  sectionError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionErrorText: {
    ...typography.caption,
    color: palette.destructive,
  },
});
