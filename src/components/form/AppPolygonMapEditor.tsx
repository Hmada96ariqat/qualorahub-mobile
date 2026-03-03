import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MapView, {
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  type MapPressEvent,
  type Region,
} from 'react-native-maps';
import { palette, radius, spacing, typography } from '../../theme/tokens';
import type { MapCoordinate } from '../../utils/geojson';
import { hasSelfIntersection, isNearFirstPoint } from '../../utils/geometry';
import { AppButton } from '../primitives/AppButton';

export type PolygonOverlay = {
  id: string;
  points: MapCoordinate[];
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
};

export type PolygonInvalidReason =
  | 'min_points'
  | 'self_intersection'
  | 'disabled'
  | 'map_unavailable';

type AppPolygonMapEditorProps = {
  points: MapCoordinate[];
  onChangePoints: (nextPoints: MapCoordinate[]) => void;
  disabled?: boolean;
  overlays?: PolygonOverlay[];
  onComplete?: (completedPoints: MapCoordinate[]) => void;
  onInvalidAction?: (reason: PolygonInvalidReason) => void;
  onMapUnavailable?: () => void;
  helperText?: string;
  instructionText?: string;
  allowSnapClose?: boolean;
  snapDistanceMeters?: number;
  allowDoubleTapFinish?: boolean;
  completeLabel?: string;
  showCompleteButton?: boolean;
  mapTimeoutMs?: number;
  preferGoogleProvider?: boolean;
  testID?: string;
};

const DEFAULT_REGION: Region = {
  latitude: 31.95,
  longitude: 35.91,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const IOS_GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY;

function shouldUseGoogleProvider(preferGoogleProvider: boolean): boolean {
  if (!preferGoogleProvider) return false;
  if (Platform.OS === 'android') return true;
  if (Platform.OS === 'ios') return Boolean(IOS_GOOGLE_MAPS_KEY);
  return false;
}

function getInitialRegion(points: MapCoordinate[]): Region {
  if (points.length === 0) {
    return DEFAULT_REGION;
  }

  const bounds = points.reduce(
    (acc, point) => ({
      minLat: Math.min(acc.minLat, point.latitude),
      maxLat: Math.max(acc.maxLat, point.latitude),
      minLng: Math.min(acc.minLng, point.longitude),
      maxLng: Math.max(acc.maxLng, point.longitude),
    }),
    {
      minLat: points[0]?.latitude ?? DEFAULT_REGION.latitude,
      maxLat: points[0]?.latitude ?? DEFAULT_REGION.latitude,
      minLng: points[0]?.longitude ?? DEFAULT_REGION.longitude,
      maxLng: points[0]?.longitude ?? DEFAULT_REGION.longitude,
    },
  );

  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLng + bounds.maxLng) / 2,
    latitudeDelta: Math.max((bounds.maxLat - bounds.minLat) * 2, 0.01),
    longitudeDelta: Math.max((bounds.maxLng - bounds.minLng) * 2, 0.01),
  };
}

function hasDrawablePolygon(points: MapCoordinate[]): boolean {
  return points.length >= 3;
}

export function AppPolygonMapEditor({
  points,
  onChangePoints,
  disabled = false,
  overlays = [],
  onComplete,
  onInvalidAction,
  onMapUnavailable,
  helperText,
  instructionText,
  allowSnapClose = true,
  snapDistanceMeters = 15,
  allowDoubleTapFinish = true,
  completeLabel = 'Complete Boundary',
  showCompleteButton = true,
  mapTimeoutMs = 8_000,
  preferGoogleProvider = true,
  testID,
}: AppPolygonMapEditorProps) {
  const initialRegion = useMemo(() => getInitialRegion(points), [points]);
  const useGoogleProvider = useMemo(
    () => shouldUseGoogleProvider(preferGoogleProvider),
    [preferGoogleProvider],
  );
  const lastTapRef = useRef<number>(0);
  const [mapReady, setMapReady] = useState(Platform.OS === 'web');
  const [mapUnavailable, setMapUnavailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || mapReady || mapUnavailable || !onMapUnavailable) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setMapUnavailable(true);
      onMapUnavailable();
      onInvalidAction?.('map_unavailable');
    }, mapTimeoutMs);

    return () => clearTimeout(timeout);
  }, [mapReady, mapTimeoutMs, mapUnavailable, onInvalidAction, onMapUnavailable]);

  function handleComplete() {
    if (disabled) {
      onInvalidAction?.('disabled');
      return;
    }

    if (points.length < 3) {
      onInvalidAction?.('min_points');
      return;
    }

    if (hasSelfIntersection(points)) {
      onInvalidAction?.('self_intersection');
      return;
    }

    onComplete?.(points);
  }

  function handleMapPress(event: MapPressEvent) {
    if (disabled) {
      onInvalidAction?.('disabled');
      return;
    }

    const coordinate = event.nativeEvent.coordinate;
    const now = Date.now();

    if (allowDoubleTapFinish && points.length >= 3 && now - lastTapRef.current <= 280) {
      handleComplete();
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;

    if (allowSnapClose && isNearFirstPoint(points, coordinate, snapDistanceMeters)) {
      handleComplete();
      return;
    }

    onChangePoints([...points, coordinate]);
  }

  function removeLastPoint() {
    onChangePoints(points.slice(0, -1));
  }

  function clearPoints() {
    onChangePoints([]);
  }

  const mapHelperText =
    helperText ??
    (hasDrawablePolygon(points)
      ? 'Boundary ready. Tap complete to validate and save.'
      : 'Tap map to add points. Add at least 3 points.');

  const mapInstruction = instructionText ?? 'Tap near first point (15m) or double tap to finish.';

  return (
    <View style={styles.container} testID={testID}>
      {Platform.OS === 'web' ? (
        <View style={styles.unsupported}>
          <Text style={styles.unsupportedText}>Map drawing is available on iOS and Android.</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          onMapReady={() => setMapReady(true)}
          provider={useGoogleProvider ? PROVIDER_GOOGLE : undefined}
          scrollEnabled={!disabled}
          zoomEnabled={!disabled}
          rotateEnabled={!disabled}
          pitchEnabled={!disabled}
          testID={`${testID ?? 'polygon-map'}-canvas`}
        >
          {overlays.map((overlay) =>
            hasDrawablePolygon(overlay.points) ? (
              <Polygon
                key={overlay.id}
                coordinates={overlay.points}
                strokeColor={overlay.strokeColor ?? '#2C6BED'}
                fillColor={overlay.fillColor ?? 'rgba(44, 107, 237, 0.15)'}
                strokeWidth={overlay.strokeWidth ?? 1}
              />
            ) : null,
          )}

          {points.map((point, index) => (
            <Marker
              key={`${point.latitude}-${point.longitude}-${index}`}
              coordinate={point}
            />
          ))}

          {hasDrawablePolygon(points) ? (
            <Polygon
              coordinates={points}
              strokeColor={palette.primary}
              fillColor="rgba(36, 143, 54, 0.2)"
              strokeWidth={2}
            />
          ) : null}
        </MapView>
      )}

      <Text style={styles.helperText}>{mapHelperText}</Text>
      <Text style={styles.helperText}>{mapInstruction}</Text>
      {Platform.OS === 'ios' && preferGoogleProvider && !useGoogleProvider ? (
        <Text style={styles.helperText}>
          Google Maps iOS key not configured; using native map provider.
        </Text>
      ) : null}
      {mapUnavailable ? <Text style={styles.fallbackText}>Map unavailable. Use manual fallback.</Text> : null}

      <View style={styles.actions}>
        <AppButton
          label="Undo Point"
          mode="outlined"
          tone="neutral"
          onPress={removeLastPoint}
          disabled={disabled || points.length === 0}
          testID={testID ? `${testID}.undo` : 'polygon-map.undo'}
        />
        <AppButton
          label="Clear"
          mode="text"
          tone="destructive"
          onPress={clearPoints}
          disabled={disabled || points.length === 0}
          testID={testID ? `${testID}.clear` : 'polygon-map.clear'}
        />
        {showCompleteButton ? (
          <AppButton
            label={completeLabel}
            mode="contained"
            tone="primary"
            onPress={handleComplete}
            disabled={disabled || points.length < 3}
            testID={testID ? `${testID}.complete` : 'polygon-map.complete'}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  map: {
    height: 240,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  unsupported: {
    minHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  unsupportedText: {
    ...typography.caption,
    color: palette.mutedForeground,
    textAlign: 'center',
  },
  helperText: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  fallbackText: {
    ...typography.caption,
    color: palette.destructive,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-start',
  },
});
