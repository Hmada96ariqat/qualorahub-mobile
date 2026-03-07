import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { palette, spacing, typography } from '../../../theme/tokens';

const AUTH_BRAND_LOGO = require('../../../../assets/qualorahub-logo.png');

type AuthBrandHeaderProps = {
  subtitle: string;
};

export function AuthBrandHeader({ subtitle }: AuthBrandHeaderProps) {
  return (
    <View style={styles.brand}>
      <Image
        source={AUTH_BRAND_LOGO}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="QualoraHub logo"
      />
      <Text style={styles.brandName}>QualoraHub</Text>
      <Text style={styles.brandSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    width: 110,
    height: 110,
  },
  brandName: {
    ...typography.title,
    color: palette.foreground,
    fontSize: 30,
    lineHeight: 36,
  },
  brandSubtitle: {
    ...typography.body,
    color: palette.mutedForeground,
    textAlign: 'center',
  },
});
