import React from 'react';
import { StyleSheet } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { TextInput } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';

type AppInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  disabled?: boolean;
  error?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

export function AppInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  disabled = false,
  error = false,
  testID,
  accessibilityLabel,
}: AppInputProps) {
  return (
    <TextInput
      mode="outlined"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      secureTextEntry={secureTextEntry}
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
