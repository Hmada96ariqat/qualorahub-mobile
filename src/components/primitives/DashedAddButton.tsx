import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';

type DashedAddButtonProps = {
  label: string;
  onPress: () => void;
  testID?: string;
};

export function DashedAddButton({ label, onPress, testID }: DashedAddButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      testID={testID}
    >
      <Icon source="plus" size={14} color={palette.primaryDark} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    width: '100%',
    paddingVertical: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.primary,
    borderRadius: radius.sm,
    backgroundColor: '#D8EFDD',
    marginBottom: 10,
  },
  pressed: {
    backgroundColor: '#C0E4C7',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primaryDark,
  },
});
