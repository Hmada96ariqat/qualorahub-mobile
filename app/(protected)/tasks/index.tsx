import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { TasksScreen } from '../../../src/modules/tasks/screens/TasksScreen';

export default function TasksRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('tasks');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Tasks"
      onSignOut={() => void signOut()}
    >
      <TasksScreen />
    </ModuleAccessGate>
  );
}
