import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { DashboardShell } from '../../../src/modules/dashboard/screens/DashboardShell';

export default function DashboardRoute() {
  const { loading, allowed } = usePermissionGate('dashboard');
  const { session, signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel="Dashboard"
      onSignOut={() => void signOut()}
    >
      <DashboardShell email={session?.user.email ?? ''} />
    </ModuleAccessGate>
  );
}
