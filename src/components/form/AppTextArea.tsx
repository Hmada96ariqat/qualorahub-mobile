import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';

type AppTextAreaProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  numberOfLines?: number;
  disabled?: boolean;
  error?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export function AppTextArea({
  value,
  onChangeText,
  placeholder,
  numberOfLines = 4,
  disabled = false,
  error = false,
  accessibilityLabel = 'Text area',
  testID,
}: AppTextAreaProps) {
  return (
    <TextInput
      mode="outlined"
      multiline
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      numberOfLines={numberOfLines}
      disabled={disabled}
      error={error}
      outlineColor={palette.border}
      activeOutlineColor={palette.ring}
      selectionColor={palette.primary}
      style={styles.input}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
  },
});
