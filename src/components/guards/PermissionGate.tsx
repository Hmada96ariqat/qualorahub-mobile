import React from 'react';
import type { ReactNode } from 'react';

type PermissionGateProps = {
  allowed: boolean;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate({ allowed, children, fallback = null }: PermissionGateProps) {
  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
