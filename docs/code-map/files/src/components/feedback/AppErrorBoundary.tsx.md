# Code Map: `src/components/feedback/AppErrorBoundary.tsx`

## Purpose
Source module.

## Imports
- `import React from 'react';`
- `import type { ErrorInfo, ReactNode } from 'react';`
- `import { reportAppError } from '../../utils/observability';`
- `import { AppScreen } from '../layout/AppScreen';`
- `import { ErrorState } from './ErrorState';`

## Exports
- `export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {`
