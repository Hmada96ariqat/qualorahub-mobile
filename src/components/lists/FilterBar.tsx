import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppSearchInput } from '../primitives/AppSearchInput';
import { spacing } from '../../theme/tokens';

type FilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  testID?: string;
};

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  children,
  testID,
}: FilterBarProps) {
  return (
    <View style={styles.container} testID={testID}>
      <AppSearchInput
        value={searchValue}
        onChangeText={onSearchChange}
        placeholder={searchPlaceholder}
      />
      {children ? <View style={styles.extraFilters}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  extraFilters: {
    width: '100%',
    gap: spacing.sm,
  },
});
