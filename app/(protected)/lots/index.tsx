import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { LotsScreen } from '../../../src/modules/lots/screens/LotsScreen';

export default function LotsScreenRoute() {
  const { loading, allowed } = usePermissionGate('lots');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Lots'
      onSignOut={() => void signOut()}
    >
      <LotsScreen />
    </ModuleAccessGate>
  );
}
