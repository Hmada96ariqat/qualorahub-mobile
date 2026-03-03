import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { EquipmentScreen } from '../../../src/modules/equipment/screens/EquipmentScreen';

export default function EquipmentScreenRoute() {
  const { loading, allowed } = usePermissionGate('equipment');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Equipment'
      onSignOut={() => void signOut()}
    >
      <EquipmentScreen />
    </ModuleAccessGate>
  );
}
