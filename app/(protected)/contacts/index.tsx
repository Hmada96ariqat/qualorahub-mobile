import React from 'react';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { ContactsScreen } from '../../../src/modules/contacts/screens/ContactsScreen';

export default function ContactsRoute() {
  const { loading, allowed } = usePermissionGate('contacts');
  const { signOut } = useAuth();

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel="Contacts"
      onSignOut={() => void signOut()}
    >
      <ContactsScreen />
    </ModuleAccessGate>
  );
}
