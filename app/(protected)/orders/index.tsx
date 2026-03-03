import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { OrdersScreen } from '../../../src/modules/orders/screens/OrdersScreen';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function OrdersRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('orders');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Orders"
      onSignOut={() => void signOut()}
    >
      <OrdersScreen />
    </ModuleAccessGate>
  );
}
