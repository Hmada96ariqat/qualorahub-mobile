import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { ManagementScreen } from '../../../src/modules/management/screens/ManagementScreen';

export default function ManagementRoute() {
  const { loading, allowed } = usePermissionGate('users');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel="Management"
      onSignOut={() => void signOut()}
    >
      <ManagementScreen />
    </ModuleAccessGate>
  );
}
