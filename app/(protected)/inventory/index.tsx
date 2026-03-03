import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { InventoryScreen } from '../../../src/modules/inventory/screens/InventoryScreen';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function InventoryRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('inventory');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Inventory"
      onSignOut={() => void signOut()}
    >
      <InventoryScreen />
    </ModuleAccessGate>
  );
}
