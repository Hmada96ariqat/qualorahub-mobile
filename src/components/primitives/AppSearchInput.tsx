import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';

type AppSearchInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  testID?: string;
};

export function AppSearchInput({
  value,
  onChangeText,
  placeholder = 'Search',
  testID,
}: AppSearchInputProps) {
  return (
    <TextInput
      mode="outlined"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoCapitalize="none"
      outlineColor={palette.border}
      activeOutlineColor={palette.ring}
      selectionColor={palette.primary}
      left={<TextInput.Icon icon="magnify" color={palette.mutedForeground} />}
      style={styles.input}
      testID={testID}
      accessibilityLabel="Search"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
  },
});
