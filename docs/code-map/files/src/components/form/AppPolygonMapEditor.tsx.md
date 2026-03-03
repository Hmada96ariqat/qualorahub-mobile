# Code Map: `src/components/form/AppPolygonMapEditor.tsx`

## Purpose
Source module.

## Imports
- `import React, { useEffect, useMemo, useRef, useState } from 'react';`
- `import { Platform, StyleSheet, View } from 'react-native';`
- `import { Text } from 'react-native-paper';`
- `import MapView, {`
- `import { palette, radius, spacing, typography } from '../../theme/tokens';`
- `import type { MapCoordinate } from '../../utils/geojson';`
- `import { hasSelfIntersection, isNearFirstPoint } from '../../utils/geometry';`
- `import { AppButton } from '../primitives/AppButton';`

## Exports
- `export type PolygonOverlay = {`
- `export type PolygonInvalidReason =`
- `export function AppPolygonMapEditor({`
