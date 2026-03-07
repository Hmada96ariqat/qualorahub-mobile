import React, { useRef, useState } from 'react';
import { StyleSheet, View, type ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppButton,
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
import { spacing } from '../../../theme/tokens';
import { AuthBrandHeader } from '../components/AuthBrandHeader';

export function LoginScreen() {
  const router = useRouter();
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
    <AppScreen
      scroll
      scrollViewRef={scrollViewRef}
      contentContainerStyle={styles.screenContent}
    >
      <AuthBrandHeader subtitle="Sign in to continue" />

      <SectionCard>
        <FormValidationProvider value={formValidation.providerValue}>
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
        </FormValidationProvider>

        <View style={styles.authLinks}>
          <AppButton
            label="Forgot password?"
            mode="text"
            tone="neutral"
            onPress={() => router.push('/(public)/forgot-password')}
          />
          <AppButton
            label="Reset your password"
            mode="text"
            tone="neutral"
            onPress={() => router.push('/(public)/reset-password')}
          />
        </View>
      </SectionCard>

      <LoadingOverlay
        visible={submitting}
        label="Signing in..."
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  authLinks: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
});
