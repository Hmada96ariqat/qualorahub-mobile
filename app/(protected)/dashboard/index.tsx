import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { DashboardShell } from '../../../src/modules/dashboard/screens/DashboardShell';
import { useAuth } from '../../../src/providers/AuthProvider';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';

export default function DashboardRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('dashboard');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Dashboard"
      onSignOut={() => void signOut()}
    >
      <DashboardShell
        email={session.user.email}
        onSignOut={() => void signOut()}
      />
    </ModuleAccessGate>
  );
}
