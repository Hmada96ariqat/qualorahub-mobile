import React from 'react';
import { useRouter } from 'expo-router';
import { AppTabs } from '../../../components';

export type AuthRouteTab = 'login' | 'forgot' | 'reset';

type AuthRouteTabsProps = {
  activeTab: AuthRouteTab;
};

export function AuthRouteTabs({ activeTab }: AuthRouteTabsProps) {
  const router = useRouter();

  return (
    <AppTabs
      value={activeTab}
      onValueChange={(nextValue) => {
        const tab = nextValue as AuthRouteTab;
        if (tab === 'forgot') {
          router.replace('/(public)/forgot-password');
          return;
        }
        if (tab === 'reset') {
          router.replace('/(public)/reset-password');
          return;
        }
        router.replace('/(public)/auth/login');
      }}
      tabs={[
        { value: 'login', label: 'Login' },
        { value: 'forgot', label: 'Forgot' },
        { value: 'reset', label: 'Reset' },
      ]}
    />
  );
}
