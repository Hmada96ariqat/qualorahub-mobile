import React from 'react';
import { router } from 'expo-router';
import { HeaderIconButton } from '../primitives/HeaderIconButton';

type NotificationHeaderButtonProps = {
  testID?: string;
};

export function NotificationHeaderButton({ testID }: NotificationHeaderButtonProps) {
  return (
    <HeaderIconButton
      icon="bell-outline"
      onPress={() => router.push('/(protected)/notifications')}
      testID={testID}
    />
  );
}
