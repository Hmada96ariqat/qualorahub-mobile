import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppButton } from '../primitives/AppButton';
import { palette, spacing, typography } from '../../theme/tokens';

type PaginationFooterProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  loading?: boolean;
  onPageChange: (nextPage: number) => void;
  testID?: string;
};

export function PaginationFooter({
  page,
  pageSize,
  totalItems,
  loading = false,
  onPageChange,
  testID,
}: PaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canGoBack = page > 1 && !loading;
  const canGoNext = page < totalPages && !loading;

  return (
    <View style={styles.container} testID={testID}>
      <AppButton
        label="Previous"
        mode="text"
        tone="neutral"
        onPress={() => onPageChange(page - 1)}
        disabled={!canGoBack}
      />
      <Text style={styles.status}>
        Page {page} of {totalPages}
      </Text>
      <AppButton
        label="Next"
        mode="text"
        tone="neutral"
        onPress={() => onPageChange(page + 1)}
        disabled={!canGoNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  status: {
    ...typography.caption,
    color: palette.mutedForeground,
    textAlign: 'center',
  },
});
