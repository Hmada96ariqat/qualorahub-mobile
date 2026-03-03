# Code Map: `src/modules/lots/screens/LotsScreen.tsx`

## Purpose
Feature module implementation.

## Imports
- `import React, { useEffect, useMemo, useState } from 'react';`
- `import { StyleSheet, View } from 'react-native';`
- `import { useRouter } from 'expo-router';`
- `import { Text } from 'react-native-paper';`
- `import type { FieldStatusFilter } from '../../../api/modules/fields';`
- `import type { LotSummary, LotStatusFilter } from '../../../api/modules/lots';`
- `import {`
- `import { useAppI18n } from '../../../hooks/useAppI18n';`
- `import { useModuleActionPermissions } from '../../../hooks/useModuleActionPermissions';`
- `import { palette, spacing, typography } from '../../../theme/tokens';`
- `import { fromGeoJsonPolygon, toGeoJsonPolygon, type MapCoordinate } from '../../../utils/geojson';`
- `import {`
- `import {`
- `import { createLotPayloadSchema } from '../validation';`
- `import { useLotsModule } from '../useLotsModule.hook';`

## Exports
- `export function LotsScreen() {`
