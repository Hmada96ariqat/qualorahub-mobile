import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppQueryProvider } from './src/providers/AppQueryProvider';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { LoginScreen } from './src/modules/auth/screens/LoginScreen';
import { DashboardShell } from './src/modules/dashboard/screens/DashboardShell';
import { palette } from './src/theme/tokens';

function AppContent() {
  const { session, loading, signOut } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <DashboardShell
      email={session.user.email}
      onSignOut={() => void signOut()}
    />
  );
}

export default function App() {
  return (
    <AppQueryProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppQueryProvider>
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
