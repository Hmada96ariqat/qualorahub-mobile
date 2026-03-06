import React from 'react';
import { useProtectedDrawer } from '../../providers/ProtectedDrawerProvider';
import { HeaderIconButton } from '../primitives/HeaderIconButton';

type HeaderMenuButtonProps = {
  testID?: string;
};

export function HeaderMenuButton({ testID }: HeaderMenuButtonProps) {
  const drawer = useProtectedDrawer();

  if (!drawer) {
    return null;
  }

  return <HeaderIconButton icon="menu" onPress={drawer.openDrawer} testID={testID} />;
}
