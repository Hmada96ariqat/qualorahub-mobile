import React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/tokens';

type SectionHeaderProps = {
  title: string;
  trailing?: string;
  titleColor?: string;
  testID?: string;
};

export function SectionHeader({ title, trailing, titleColor, testID }: SectionHeaderProps) {
  return (
    <View style={[styles.container, I18nManager.isRTL ? styles.containerRtl : null]} testID={testID}>
      <Text style={[styles.title, titleColor ? { color: titleColor } : undefined]}>{title}</Text>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  containerRtl: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  trailing: {
    fontSize: 12,
    color: palette.mutedForeground,
  },
});
