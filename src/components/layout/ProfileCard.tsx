import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { palette, radius } from '../../theme/tokens';
import { InfoGrid, type InfoGridCell } from './InfoGrid';

type ProfileCardProps = {
  icon: string;
  name: string;
  subtitle: string;
  cells: InfoGridCell[];
  testID?: string;
};

export function ProfileCard({ icon, name, subtitle, cells, testID }: ProfileCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Icon source={icon} size={24} color={palette.primaryDark} />
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      {cells.length > 0 && <InfoGrid cells={cells} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 14,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#D8EFDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.foreground,
  },
  subtitle: {
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: 1,
  },
});
