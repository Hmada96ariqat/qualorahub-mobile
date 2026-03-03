# Code Map: `src/hooks/useModuleActionPermissions.ts`

## Purpose
Reusable cross-feature hook.

## Imports
- `import { useMemo } from 'react';`
- `import { useAuth } from '../providers/AuthProvider';`
- `import { resolvePermissionKeys } from './usePermissionGate';`

## Exports
- `export type CrudAction = 'view' | 'add' | 'edit' | 'delete';`
- `export type ModuleActionPermissions = Record<CrudAction, boolean>;`
- `export function useModuleActionPermissions(menuKey: string) {`
