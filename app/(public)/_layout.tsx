import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { palette } from '../../src/theme/tokens';
import { resolvePublicRouteGuard } from '../../src/utils/route-guards';

export default function PublicLayout() {
  const { session, loading } = useAuth();
  const decision = resolvePublicRouteGuard(session, loading);

  if (decision === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (decision === 'redirect-protected') {
    return <Redirect href="/(protected)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
});
