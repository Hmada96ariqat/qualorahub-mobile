import React, { useState } from 'react';
import {
  AppButton,
  AppHeader,
  AppInput,
  AppPasswordInput,
  AppScreen,
  ErrorState,
  FormField,
  LoadingOverlay,
  SectionCard,
} from '../../../components';
import { useAuth } from '../../../providers/AuthProvider';
import { AuthRouteTabs } from '../components/AuthRouteTabs';

export function LoginScreen() {
  const { signIn, sessionNotice, clearSessionNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      clearSessionNotice();
      await signIn(email.trim(), password);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Login failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="QualoraHub Mobile"
        subtitle="Sign in to continue"
      />

      <AuthRouteTabs activeTab="login" />

      <SectionCard>
        {sessionNotice ? (
          <ErrorState
            title="Session Notice"
            message={sessionNotice}
          />
        ) : null}

        <FormField
          label="Email"
          required
        >
          <AppInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="email@example.com"
            accessibilityLabel="Email"
            testID="auth.login.email"
          />
        </FormField>

        <FormField
          label="Password"
          required
        >
          <AppPasswordInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            testID="auth.login.password"
          />
        </FormField>

        {error ? (
          <ErrorState
            title="Login Failed"
            message={error}
          />
        ) : null}

        <AppButton
          label="Sign In"
          onPress={onSubmit}
          loading={submitting}
          disabled={submitting}
          testID="auth.login.submit"
        />
      </SectionCard>

      <LoadingOverlay
        visible={submitting}
        label="Signing in..."
      />
    </AppScreen>
  );
}
