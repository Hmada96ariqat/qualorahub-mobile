import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { FieldsScreen } from '../../../src/modules/fields/screens/FieldsScreen';

export default function FieldsScreenRoute() {
  const { loading, allowed } = usePermissionGate('fields');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Fields'
      onSignOut={() => void signOut()}
    >
      <FieldsScreen />
    </ModuleAccessGate>
  );
}
