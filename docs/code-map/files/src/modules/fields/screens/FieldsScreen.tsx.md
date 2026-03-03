# Code Map: `src/modules/fields/screens/FieldsScreen.tsx`

## Purpose
Feature module implementation.

## Imports
- `import React, { useEffect, useMemo, useState } from 'react';`
- `import { StyleSheet, View } from 'react-native';`
- `import { useRouter } from 'expo-router';`
- `import { Text } from 'react-native-paper';`
- `import type {`
- `import {`
- `import { useAppI18n } from '../../../hooks/useAppI18n';`
- `import { useModuleActionPermissions } from '../../../hooks/useModuleActionPermissions';`
- `import { palette, spacing, typography } from '../../../theme/tokens';`
- `import { polygonAreaHectares } from '../../../utils/geometry';`
- `import { fromGeoJsonPolygon, toGeoJsonPolygon, type MapCoordinate } from '../../../utils/geojson';`
- `import {`
- `import {`
- `import { useFieldsModule } from '../useFieldsModule.hook';`
- `import { validateFieldBoundaryInput } from '../validation';`

## Exports
- `export function FieldsScreen() {`
