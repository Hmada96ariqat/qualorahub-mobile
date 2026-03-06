import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { AccountScreen } from '../../../src/modules/account/screens/AccountScreen';

export default function AccountRoute() {
  const { loading, allowed } = usePermissionGate('settings');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel="Account"
      onSignOut={() => void signOut()}
    >
      <AccountScreen />
    </ModuleAccessGate>
  );
}
