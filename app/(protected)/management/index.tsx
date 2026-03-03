import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { useAuth } from '../../../src/providers/AuthProvider';
import { ManagementScreen } from '../../../src/modules/management/screens/ManagementScreen';

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
  const { signOut, accessLoading, accessSnapshot, hasMenuAccess } = useAuth();
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
