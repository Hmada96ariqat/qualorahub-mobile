import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ModuleAccessGate } from '../../../src/components';
import { usePermissionGate } from '../../../src/hooks/usePermissionGate';
import { useAuth } from '../../../src/providers/AuthProvider';
import { CropsScreen } from '../../../src/modules/crops/screens/CropsScreen';

function toInitialCropsTab(
  value: string | string[] | undefined,
): 'crops' | 'cycles' | 'logbook' {
  if (Array.isArray(value)) {
    return toInitialCropsTab(value[0]);
  }

  if (value === 'cycles' || value === 'logbook') {
    return value;
  }

  return 'crops';
}

export default function CropsScreenRoute() {
  const { loading, allowed } = usePermissionGate('crops');
  const { signOut } = useAuth();
  const { tab } = useLocalSearchParams<{ tab?: string | string[] }>();
  const initialTab = toInitialCropsTab(tab);

  return (
    <ModuleAccessGate
      loading={loading}
      allowed={allowed}
      moduleLabel='Crops'
      onSignOut={() => void signOut()}
    >
      <CropsScreen initialTab={initialTab} />
    </ModuleAccessGate>
  );
}
