import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { CropsScreen } from '../../../src/modules/crops/screens/CropsScreen';

export default function CropsScreenRoute() {
  const { loading, allowed } = usePermissionGate('crops');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Crops'
      onSignOut={() => void signOut()}
    >
      <CropsScreen />
    </ModuleAccessGate>
  );
}
