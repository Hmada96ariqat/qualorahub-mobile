# Code Map: `src/providers/__tests__/AuthProvider.test.tsx`

## Purpose
App-level provider and dependency wiring.

## Imports
- `import React from 'react';`
- `import { Pressable, Text } from 'react-native';`
- `import { act, fireEvent, render, waitFor } from '@testing-library/react-native';`
- `import { AuthProvider, useAuth } from '../AuthProvider';`
- `import { login, logout, refresh } from '../../modules/auth/api';`
- `import { getAuthContext, getRbacSnapshot } from '../../api/modules/auth';`
- `import {`
- `import { setUnauthorizedHandler, type UnauthorizedEvent } from '../../api/client';`
- `import {`
- `import type { AuthSession } from '../../types/auth';`

## Exports
- none
