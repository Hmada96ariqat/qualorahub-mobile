import React from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/tokens';

export function HeaderActionGroup({ children }: { children: React.ReactNode }) {
  return <View style={[styles.row, I18nManager.isRTL ? styles.rowRtl : null]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
});
