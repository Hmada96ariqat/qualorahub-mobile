import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { EquipmentScreen } from '../../../src/modules/equipment/screens/EquipmentScreen';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function EquipmentRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('equipment');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Equipment"
      onSignOut={() => void signOut()}
    >
      <EquipmentScreen />
    </ModuleAccessGate>
  );
}
