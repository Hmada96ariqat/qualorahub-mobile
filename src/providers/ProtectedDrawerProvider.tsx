import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { AppBadge } from '../components/primitives/AppBadge';
import { ListRow } from '../components/lists/ListRow';
import { SectionHeader } from '../components/layout/SectionHeader';
import { DrawerSheet } from '../components/overlays/DrawerSheet';
import { AppButton } from '../components/primitives/AppButton';
import { resolvePermissionKeys } from '../hooks/usePermissionGate';
import {
  PROTECTED_NAVIGATION_GROUPS,
  PROTECTED_NAVIGATION_ITEMS,
  toProtectedPath,
  type ProtectedNavigationItem,
} from '../navigation/protectedNavigation';
import { useAuth } from './AuthProvider';

type ProtectedDrawerContextValue = {
  openDrawer: () => void;
  closeDrawer: () => void;
};

const ProtectedDrawerContext = createContext<ProtectedDrawerContextValue | null>(null);

function toFarmLabel(farmName: string | null | undefined, email: string | null | undefined): string {
  const normalizedFarmName = farmName?.trim();
  if (normalizedFarmName) {
    return normalizedFarmName;
  }

  const normalizedEmail = email?.trim();
  return normalizedEmail || 'QualoraHub';
}

function isItemActive(item: ProtectedNavigationItem, pathname: string): boolean {
  const itemPath = toProtectedPath(item.href);
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function ProtectedDrawerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessLoading, accessSnapshot, hasMenuAccess, signOut } = useAuth();
  const [visible, setVisible] = useState(false);

  const availableItems = useMemo(() => {
    return PROTECTED_NAVIGATION_ITEMS.filter((item) => {
      if (item.key === 'dashboard') return true;
      if (accessLoading) return true;
      return resolvePermissionKeys(item.menuKey).some((menuKey) => hasMenuAccess(menuKey));
    });
  }, [accessLoading, hasMenuAccess]);

  const groupedItems = useMemo(() => {
    return PROTECTED_NAVIGATION_GROUPS.map((group) => ({
      ...group,
      items: availableItems.filter((item) => item.group === group.key),
    })).filter((group) => group.items.length > 0);
  }, [availableItems]);

  useEffect(() => {
    setVisible(false);
  }, [pathname]);

  const contextValue = useMemo<ProtectedDrawerContextValue>(
    () => ({
      openDrawer: () => setVisible(true),
      closeDrawer: () => setVisible(false),
    }),
    [],
  );

  const drawerSubtitle = toFarmLabel(accessSnapshot.context?.farmName, accessSnapshot.context?.email);

  return (
    <ProtectedDrawerContext.Provider value={contextValue}>
      {children}
      <DrawerSheet
        visible={visible}
        title="Navigate"
        subtitle={drawerSubtitle}
        onDismiss={() => setVisible(false)}
        testID="protected-navigation-drawer"
        footer={
          <AppButton
            label="Sign Out"
            mode="outlined"
            tone="destructive"
            onPress={() => {
              setVisible(false);
              void signOut();
            }}
          />
        }
      >
        {groupedItems.map((group) => (
          <React.Fragment key={group.key}>
            <SectionHeader title={group.label} trailing={`${group.items.length} modules`} />
            {group.items.map((item) => {
              const active = isItemActive(item, pathname);
              return (
                <ListRow
                  key={item.key}
                  icon={item.icon}
                  iconVariant={item.group === 'commerce' ? 'amber' : item.group === 'operations' ? 'green' : 'neutral'}
                  title={item.label}
                  subtitle={item.drawerSubtitle}
                  badge={active ? <AppBadge value="Now" variant="accent" /> : undefined}
                  accentBorder={active}
                  onPress={() => {
                    setVisible(false);
                    if (!active) {
                      router.push(item.href);
                    }
                  }}
                  testID={`protected-navigation-drawer-row-${item.key}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </DrawerSheet>
    </ProtectedDrawerContext.Provider>
  );
}

export function useProtectedDrawer(): ProtectedDrawerContextValue | null {
  return useContext(ProtectedDrawerContext);
}
