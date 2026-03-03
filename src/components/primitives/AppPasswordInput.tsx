import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';

type AppPasswordInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  testID?: string;
};

export function AppPasswordInput({
  value,
  onChangeText,
  placeholder = 'Password',
  disabled = false,
  error = false,
  testID,
}: AppPasswordInputProps) {
  const [hidden, setHidden] = useState(true);

  return (
    <TextInput
      mode="outlined"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={hidden}
      disabled={disabled}
      error={error}
      outlineColor={palette.border}
      activeOutlineColor={palette.ring}
      selectionColor={palette.primary}
      style={styles.input}
      right={
        <TextInput.Icon
          icon={hidden ? 'eye-off' : 'eye'}
          onPress={() => setHidden((prev) => !prev)}
          color={palette.mutedForeground}
        />
      }
      testID={testID}
      accessibilityLabel="Password"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
  },
});
