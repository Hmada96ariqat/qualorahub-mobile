# Code Map: `src/modules/dashboard/screens/DashboardShell.tsx`

## Purpose
Feature module implementation.

## Imports
- `import React, { useMemo, useState } from 'react';`
- `import { StyleSheet, View } from 'react-native';`
- `import { useRouter } from 'expo-router';`
- `import { useFocusEffect } from '@react-navigation/native';`
- `import { Text } from 'react-native-paper';`
- `import {`
- `import { palette, spacing, typography } from '../../../theme/tokens';`
- `import { useAuth } from '../../../providers/AuthProvider';`
- `import { useDashboardSnapshot } from '../useDashboardSnapshot.hook';`

## Exports
- `export function DashboardShell({ email, onSignOut }: Props) {`
