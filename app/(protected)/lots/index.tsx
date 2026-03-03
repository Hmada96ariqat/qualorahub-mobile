import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { LotsScreen } from '../../../src/modules/lots/screens/LotsScreen';

export default function LotsRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('lots');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Lots"
      onSignOut={() => void signOut()}
    >
      <LotsScreen />
    </ModuleAccessGate>
  );
}
