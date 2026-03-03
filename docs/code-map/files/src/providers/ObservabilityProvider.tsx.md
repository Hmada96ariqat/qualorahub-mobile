# Code Map: `src/providers/ObservabilityProvider.tsx`

## Purpose
App-level provider and dependency wiring.

## Imports
- `import React, { useEffect } from 'react';`
- `import { markAppStartupComplete, reportAppError } from '../utils/observability';`

## Exports
- `export function ObservabilityProvider({ children }: { children: React.ReactNode }) {`
