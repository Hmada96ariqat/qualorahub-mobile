import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { FinanceScreen } from '../../../src/modules/finance/screens/FinanceScreen';

export default function FinanceScreenRoute() {
  const { loading, allowed } = usePermissionGate('finance');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Finance'
      onSignOut={() => void signOut()}
    >
      <FinanceScreen />
    </ModuleAccessGate>
  );
}
