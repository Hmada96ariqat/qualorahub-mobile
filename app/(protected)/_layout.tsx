import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { ProtectedDrawerProvider } from '../../src/providers/ProtectedDrawerProvider';
import { palette } from '../../src/theme/tokens';
import { resolveProtectedRouteGuard } from '../../src/utils/route-guards';

export default function ProtectedLayout() {
  const { session, loading } = useAuth();
  const decision = resolveProtectedRouteGuard(session, loading);

  if (decision === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (decision === 'redirect-public') {
    return <Redirect href="/(public)/auth/login" />;
  }

  return (
    <ProtectedDrawerProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedDrawerProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
});
