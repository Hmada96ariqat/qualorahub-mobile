import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { OrdersScreen } from '../../../src/modules/orders/screens/OrdersScreen';

export default function OrdersScreenRoute() {
  const { loading, allowed } = usePermissionGate('orders');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Orders'
      onSignOut={() => void signOut()}
    >
      <OrdersScreen />
    </ModuleAccessGate>
  );
}
