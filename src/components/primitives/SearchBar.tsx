import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { palette } from '../../theme/tokens';

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  testID?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  testID,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon source="magnify" size={15} color={palette.mutedForeground} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.mutedForeground}
        autoCapitalize="none"
        style={[styles.input, focused && styles.inputFocused]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        testID={testID}
        accessibilityLabel="Search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginTop: 8,
  },
  iconWrap: {
    position: 'absolute',
    left: 11,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 38,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.muted,
    paddingLeft: 36,
    paddingRight: 14,
    fontSize: 14,
    color: palette.foreground,
  },
  inputFocused: {
    borderColor: palette.primary,
    backgroundColor: palette.surface,
  },
});
