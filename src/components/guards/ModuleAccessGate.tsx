import React from 'react';
import type { ReactNode } from 'react';
import { EmptyState } from '../feedback/EmptyState';
import { LoadingOverlay } from '../feedback/LoadingOverlay';
import { AppScreen } from '../layout/AppScreen';
import { SectionCard } from '../layout/SectionCard';
import { PermissionGate } from './PermissionGate';

type ModuleAccessGateProps = {
  loading: boolean;
  allowed: boolean;
  moduleLabel: string;
  onSignOut: () => void;
  children: ReactNode;
};

export function ModuleAccessGate({
  loading,
  allowed,
  moduleLabel,
  onSignOut,
  children,
}: ModuleAccessGateProps) {
  if (loading) {
    return (
      <AppScreen>
        <LoadingOverlay visible label={`Loading ${moduleLabel.toLowerCase()} access...`} />
      </AppScreen>
    );
  }

  return (
    <PermissionGate
      allowed={allowed}
      fallback={
        <AppScreen>
          <SectionCard>
            <EmptyState
              title={`${moduleLabel} Access Locked`}
              message="Your role or subscription does not allow access to this module."
              actionLabel="Sign Out"
              onAction={onSignOut}
            />
          </SectionCard>
        </AppScreen>
      }
    >
      {children}
    </PermissionGate>
  );
}
