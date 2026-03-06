import React, { useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import {
  AppButton,
  AppHeader,
  AppInput,
  AppPasswordInput,
  AppScreen,
  ErrorState,
  FormValidationProvider,
  FormField,
  LoadingOverlay,
  SectionCard,
  useFormValidation,
} from '../../../components';
import { useAuth } from '../../../providers/AuthProvider';
import { AuthRouteTabs } from '../components/AuthRouteTabs';

export function LoginScreen() {
  const { signIn, sessionNotice, clearSessionNotice } = useAuth();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const formValidation = useFormValidation<'email' | 'password'>(scrollViewRef);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    const valid = formValidation.validate([
      {
        field: 'email',
        message: 'Email is required.',
        isValid: email.trim().length > 0,
      },
      {
        field: 'password',
        message: 'Password is required.',
        isValid: password.length > 0,
      },
    ]);
    if (!valid) {
      return;
    }

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
    <AppScreen scroll scrollViewRef={scrollViewRef}>
      <AppHeader
        title="QualoraHub Mobile"
        subtitle="Sign in to continue"
      />

      <AuthRouteTabs activeTab="login" />

      <FormValidationProvider value={formValidation.providerValue}>
        <SectionCard>
          {sessionNotice ? (
            <ErrorState
              title="Session Notice"
              message={sessionNotice}
            />
          ) : null}

          <FormField
            label="Email"
            name="email"
            required
          >
            <AppInput
              value={email}
              onChangeText={(value) => {
                formValidation.clearFieldError('email');
                setEmail(value);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="email@example.com"
              accessibilityLabel="Email"
              testID="auth.login.email"
            />
          </FormField>

          <FormField
            label="Password"
            name="password"
            required
          >
            <AppPasswordInput
              value={password}
              onChangeText={(value) => {
                formValidation.clearFieldError('password');
                setPassword(value);
              }}
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
      </FormValidationProvider>

      <LoadingOverlay
        visible={submitting}
        label="Signing in..."
      />
    </AppScreen>
  );
}
