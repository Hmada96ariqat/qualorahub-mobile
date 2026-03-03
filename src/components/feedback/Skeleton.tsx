import React from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { palette, radius } from '../../theme/tokens';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  testID?: string;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  testID,
}: SkeletonProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: palette.muted,
  },
});
