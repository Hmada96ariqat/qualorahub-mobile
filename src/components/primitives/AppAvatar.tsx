import React, { useMemo } from 'react';
import { Avatar } from 'react-native-paper';
import { palette } from '../../theme/tokens';

type AppAvatarProps = {
  label?: string;
  imageUrl?: string;
  size?: number;
  accessibilityLabel?: string;
  testID?: string;
};

function toInitials(label?: string): string {
  if (!label) return '?';

  const parts = label
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase());

  return parts.join('') || '?';
}

export function AppAvatar({
  label,
  imageUrl,
  size = 40,
  accessibilityLabel,
  testID,
}: AppAvatarProps) {
  const initials = useMemo(() => toInitials(label), [label]);

  if (imageUrl) {
    return (
      <Avatar.Image
        source={{ uri: imageUrl }}
        size={size}
        style={{ backgroundColor: palette.muted }}
        accessibilityLabel={accessibilityLabel ?? label ?? 'Avatar image'}
        testID={testID}
      />
    );
  }

  return (
    <Avatar.Text
      label={initials}
      size={size}
      color={palette.onPrimary}
      style={{ backgroundColor: palette.primary }}
      accessibilityLabel={accessibilityLabel ?? label ?? 'Avatar initials'}
      testID={testID}
    />
  );
}
