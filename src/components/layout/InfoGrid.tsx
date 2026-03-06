import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../../theme/tokens';

export type InfoGridCell = {
  label: string;
  value: string;
};

type InfoGridProps = {
  cells: InfoGridCell[];
  testID?: string;
};

export function InfoGrid({ cells, testID }: InfoGridProps) {
  const rows: InfoGridCell[][] = [];
  for (let i = 0; i < cells.length; i += 2) {
    rows.push(cells.slice(i, i + 2));
  }

  return (
    <View style={styles.grid} testID={testID}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={styles.cell}>
              <Text style={styles.cellLabel}>{cell.label}</Text>
              <Text style={styles.cellValue}>{cell.value}</Text>
            </View>
          ))}
          {row.length === 1 && <View style={styles.cell} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    backgroundColor: palette.background,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: palette.mutedForeground,
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.foreground,
    marginTop: 1,
  },
});
