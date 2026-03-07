import React from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { AppErrorBoundary, ToastProvider } from '../src/components';
import { AppQueryProvider } from '../src/providers/AppQueryProvider';
import { AuthProvider } from '../src/providers/AuthProvider';
import { LocalizationProvider } from '../src/providers/LocalizationProvider';
import { ObservabilityProvider } from '../src/providers/ObservabilityProvider';
import { LogbookQueueProvider } from '../src/providers/LogbookQueueProvider';
import { env, getNativeLoopbackWarning } from '../src/config/env';
import { appTheme } from '../src/theme/paperTheme';

let hasShownApiBaseWarning = false;

export default function RootLayout() {
  React.useEffect(() => {
    if (hasShownApiBaseWarning) {
      return;
    }

    const warning = getNativeLoopbackWarning(env.apiBaseUrl);
    if (!warning) {
      return;
    }

    hasShownApiBaseWarning = true;
    console.warn(`[api-base-warning] ${warning}`);
    Alert.alert('API Base URL Warning', warning);
  }, []);

  return (
    <AppQueryProvider>
      <ObservabilityProvider>
        <LocalizationProvider>
          <AuthProvider>
            <LogbookQueueProvider>
              <PaperProvider theme={appTheme}>
                <ToastProvider>
                  <AppErrorBoundary>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(public)" />
                      <Stack.Screen name="(protected)" />
                    </Stack>
                  </AppErrorBoundary>
                </ToastProvider>
              </PaperProvider>
            </LogbookQueueProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ObservabilityProvider>
    </AppQueryProvider>
  );
}
