import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { LivestockScreen } from '../../../src/modules/livestock/screens/LivestockScreen';

export default function LivestockScreenRoute() {
  const { loading, allowed } = usePermissionGate('livestock');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Livestock'
      onSignOut={() => void signOut()}
    >
      <LivestockScreen />
    </ModuleAccessGate>
  );
}
