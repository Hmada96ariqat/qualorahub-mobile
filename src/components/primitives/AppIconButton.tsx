import React from 'react';
import { IconButton } from 'react-native-paper';
import { palette } from '../../theme/tokens';

type AppIconButtonProps = {
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  testID?: string;
};

export function AppIconButton({
  icon,
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
}: AppIconButtonProps) {
  return (
    <IconButton
      icon={icon}
      onPress={onPress}
      disabled={disabled}
      containerColor={palette.muted}
      iconColor={palette.primary}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
}
