import React from 'react';
import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/tokens';

type AppScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AppScreen({
  children,
  scroll = false,
  padded = true,
  contentContainerStyle,
  testID,
}: AppScreenProps) {
  const theme = useAppTheme();

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} testID={testID}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            padded ? styles.padded : null,
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} testID={testID}>
      <View style={[styles.content, padded ? styles.padded : null, contentContainerStyle]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
});
