import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { NotificationsScreen } from '../../../src/modules/notifications/screens/NotificationsScreen';

export default function NotificationsRoute() {
  const { loading, allowed } = usePermissionGate('notifications');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel="Notifications"
      onSignOut={() => void signOut()}
    >
      <NotificationsScreen />
    </ModuleAccessGate>
  );
}
