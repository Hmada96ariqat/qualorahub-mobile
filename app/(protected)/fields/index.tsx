import React from 'react';
import { Redirect } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { FieldsScreen } from '../../../src/modules/fields/screens/FieldsScreen';

export default function FieldsRoute() {
  const { session, signOut } = useAuth();
  const permission = usePermissionGate('fields');

  if (!session) {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ModuleAccessGate
      loading={permission.loading}
      allowed={permission.allowed}
      moduleLabel="Fields"
      onSignOut={() => void signOut()}
    >
      <FieldsScreen />
    </ModuleAccessGate>
  );
}
