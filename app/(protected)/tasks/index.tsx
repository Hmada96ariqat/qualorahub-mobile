import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { TasksScreen } from '../../../src/modules/tasks/screens/TasksScreen';

export default function TasksScreenRoute() {
  const { loading, allowed } = usePermissionGate('tasks');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Tasks'
      onSignOut={() => void signOut()}
    >
      <TasksScreen />
    </ModuleAccessGate>
  );
}
