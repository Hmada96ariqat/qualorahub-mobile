import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { CropsScreen } from '../../../src/modules/crops/screens/CropsScreen';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function CropsRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('crops');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Crops"
      onSignOut={() => void signOut()}
    >
      <CropsScreen />
    </ModuleAccessGate>
  );
}
