import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { LivestockScreen } from '../../../src/modules/livestock/screens/LivestockScreen';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function LivestockRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('livestock');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Livestock"
      onSignOut={() => void signOut()}
    >
      <LivestockScreen />
    </ModuleAccessGate>
  );
}
