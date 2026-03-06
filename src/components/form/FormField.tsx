import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette, radius, spacing, typography } from '../../theme/tokens';
import { useFormFieldValidation } from './FormValidation';

type FormFieldProps = {
  label: string;
  name?: string;
  helperText?: string;
  errorText?: string;
  invalid?: boolean;
  required?: boolean;
  children: ReactNode;
  testID?: string;
};

export function FormField({
  label,
  name,
  helperText,
  errorText,
  invalid,
  required = false,
  children,
  testID,
}: FormFieldProps) {
  const validation = useFormFieldValidation();
  const derivedErrorText = errorText ?? (name ? validation?.errors[name] : undefined);
  const isInvalid = invalid ?? Boolean(derivedErrorText);

  return (
    <View
      style={styles.container}
      testID={testID}
      onLayout={(event) => {
        if (!name) {
          return;
        }
        validation?.registerFieldLayout(name, event.nativeEvent.layout.y);
      }}
    >
      <Text style={[styles.label, isInvalid ? styles.labelInvalid : null]}>
        {label}
        {required ? <Text style={styles.requiredMarker}> *</Text> : null}
      </Text>
      <View style={[styles.fieldFrame, isInvalid ? styles.fieldFrameInvalid : null]}>{children}</View>
      {derivedErrorText ? <Text style={styles.error}>{derivedErrorText}</Text> : null}
      {!derivedErrorText && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  labelInvalid: {
    color: palette.destructive,
  },
  requiredMarker: {
    color: palette.destructive,
  },
  fieldFrame: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radius.md,
    padding: 1,
  },
  fieldFrameInvalid: {
    borderColor: palette.destructive,
  },
  helper: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  error: {
    ...typography.caption,
    color: palette.destructive,
  },
});
