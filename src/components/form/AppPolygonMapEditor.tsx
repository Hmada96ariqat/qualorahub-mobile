import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MapView, { Marker, Polygon, type MapPressEvent, type Region } from 'react-native-maps';
import { palette, radius, spacing, typography } from '../../theme/tokens';
import type { MapCoordinate } from '../../utils/geojson';
import { AppButton } from '../primitives/AppButton';

type AppPolygonMapEditorProps = {
  points: MapCoordinate[];
  onChangePoints: (nextPoints: MapCoordinate[]) => void;
  disabled?: boolean;
  testID?: string;
};

const DEFAULT_REGION: Region = {
  latitude: 31.95,
  longitude: 35.91,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

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
      minLat: points[0].latitude,
      maxLat: points[0].latitude,
      minLng: points[0].longitude,
      maxLng: points[0].longitude,
    },
  );

  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLng + bounds.maxLng) / 2,
    latitudeDelta: Math.max((bounds.maxLat - bounds.minLat) * 2, 0.01),
    longitudeDelta: Math.max((bounds.maxLng - bounds.minLng) * 2, 0.01),
  };
}

export function AppPolygonMapEditor({
  points,
  onChangePoints,
  disabled = false,
  testID,
}: AppPolygonMapEditorProps) {
  const initialRegion = useMemo(() => getInitialRegion(points), [points]);

  function handleMapPress(event: MapPressEvent) {
    if (disabled) {
      return;
    }

    onChangePoints([...points, event.nativeEvent.coordinate]);
  }

  function removeLastPoint() {
    onChangePoints(points.slice(0, -1));
  }

  function clearPoints() {
    onChangePoints([]);
  }

  const ready = points.length >= 3;

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
          scrollEnabled={!disabled}
          zoomEnabled={!disabled}
          rotateEnabled={!disabled}
          pitchEnabled={!disabled}
          testID={`${testID ?? 'polygon-map'}-canvas`}
        >
          {points.map((point, index) => (
            <Marker
              key={`${point.latitude}-${point.longitude}-${index}`}
              coordinate={point}
            />
          ))}
          {ready ? (
            <Polygon
              coordinates={points}
              strokeColor={palette.primary}
              fillColor="rgba(36, 143, 54, 0.2)"
              strokeWidth={2}
            />
          ) : null}
        </MapView>
      )}

      <Text style={styles.helperText}>
        Tap map to add points. {ready ? 'Polygon ready.' : 'Add at least 3 points.'}
      </Text>

      <View style={styles.actions}>
        <AppButton
          label="Undo Point"
          mode="outlined"
          tone="neutral"
          onPress={removeLastPoint}
          disabled={disabled || points.length === 0}
        />
        <AppButton
          label="Clear"
          mode="text"
          tone="destructive"
          onPress={clearPoints}
          disabled={disabled || points.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  map: {
    height: 220,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-start',
  },
});
