import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';

type AlertStripProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  borderColor?: string;
  iconColor?: string;
  onPress?: () => void;
  testID?: string;
};

export function AlertStrip({
  title,
  subtitle,
  icon = 'alert-outline',
  borderColor = palette.destructive,
  iconColor = palette.destructive,
  onPress,
  testID,
}: AlertStripProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { borderLeftColor: borderColor },
        pressed && onPress ? styles.pressed : null,
      ]}
      testID={testID}
    >
      <Icon source={icon} size={18} color={iconColor} />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Icon source="chevron-right" size={16} color={palette.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  pressed: {
    backgroundColor: palette.muted,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.foreground,
  },
  subtitle: {
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: 1,
  },
});
