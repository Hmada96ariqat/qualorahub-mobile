import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme/tokens';

type FormFieldProps = {
  label: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  children: ReactNode;
  testID?: string;
};

export function FormField({
  label,
  helperText,
  errorText,
  required = false,
  children,
  testID,
}: FormFieldProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      {children}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
      {!errorText && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
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
  helper: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  error: {
    ...typography.caption,
    color: palette.destructive,
  },
});
