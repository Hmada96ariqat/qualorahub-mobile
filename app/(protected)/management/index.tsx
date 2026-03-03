import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { ManagementScreen } from '../../../src/modules/management/screens/ManagementScreen';
import { useAuth } from '../../../src/providers/AuthProvider';

function hasRoleVisibility(roleName: string | null | undefined): boolean {
  const role = (roleName ?? '').trim().toLowerCase();
  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'manager' ||
    role === 'operator' ||
    role === 'viewer'
  );
}

export default function ManagementRoute() {
  const { session, signOut, accessLoading, accessSnapshot, hasMenuAccess } = useAuth();

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  const menuAllowed =
    hasMenuAccess('users') ||
    hasMenuAccess('contacts') ||
    hasMenuAccess('settings') ||
    hasMenuAccess('notifications');

  const allowed = menuAllowed || hasRoleVisibility(accessSnapshot.context?.role);

  return (
    <ModuleAccessGate
      loading={accessLoading}
      allowed={allowed}
      moduleLabel="Management"
      onSignOut={() => void signOut()}
    >
      <ManagementScreen />
    </ModuleAccessGate>
  );
}
