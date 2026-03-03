import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { FinanceScreen } from '../../../src/modules/finance/screens/FinanceScreen';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function FinanceRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('finance');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Finance"
      onSignOut={() => void signOut()}
    >
      <FinanceScreen />
    </ModuleAccessGate>
  );
}
