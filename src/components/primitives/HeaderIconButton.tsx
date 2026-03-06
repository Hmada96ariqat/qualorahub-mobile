import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';

type HeaderIconButtonProps = {
  icon: string;
  onPress: () => void;
  filled?: boolean;
  badgeDot?: boolean;
  testID?: string;
};

export function HeaderIconButton({
  icon,
  onPress,
  filled = false,
  badgeDot = false,
  testID,
}: HeaderIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        filled ? styles.filled : styles.outlined,
        pressed && (filled ? styles.filledPressed : styles.outlinedPressed),
      ]}
      testID={testID}
    >
      <Icon source={icon} size={18} color={filled ? '#FFFFFF' : palette.foreground} />
      {badgeDot && <View style={styles.badge} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  outlinedPressed: {
    backgroundColor: palette.muted,
  },
  filled: {
    backgroundColor: palette.primary,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  filledPressed: {
    backgroundColor: palette.primaryDark,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: palette.destructive,
    borderWidth: 1.5,
    borderColor: palette.surface,
  },
});
