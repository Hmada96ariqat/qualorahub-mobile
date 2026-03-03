import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { InventoryScreen } from '../../../src/modules/inventory/screens/InventoryScreen';

export default function InventoryScreenRoute() {
  const { loading, allowed } = usePermissionGate('inventory');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Inventory'
      onSignOut={() => void signOut()}
    >
      <InventoryScreen />
    </ModuleAccessGate>
  );
}
