import React, { useRef, useState } from 'react';
import { StyleSheet, View, type ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppButton,
  AppInput,
  AppPasswordInput,
  AppScreen,
  EmptyState,
  ErrorState,
  FormValidationProvider,
  FormField,
  LoadingOverlay,
  SectionCard,
  useFormValidation,
} from '../../../components';
import { useRateLimitGuard } from '../../../hooks/useRateLimitGuard';
import { spacing } from '../../../theme/tokens';
import { resetPassword } from '../api';
import { AuthBrandHeader } from '../components/AuthBrandHeader';

export function ResetPasswordScreen() {
  const router = useRouter();
  const rateLimitGuard = useRateLimitGuard();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const formValidation = useFormValidation<'token' | 'password'>(scrollViewRef);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const valid = formValidation.validate([
      {
        field: 'token',
        message: 'Reset token is required.',
        isValid: token.trim().length > 0,
      },
      {
        field: 'password',
        message: 'New password is required.',
        isValid: password.length > 0,
      },
    ]);
    if (!valid) {
      setSubmitting(false);
      return;
    }

    try {
      const result = await rateLimitGuard.guard(() =>
        resetPassword({
          token: token.trim(),
          password,
        }),
      );
      if (result.ok) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to reset password';
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
      <AuthBrandHeader subtitle="Reset your password with your token and a new password." />

      <SectionCard>
        <FormValidationProvider value={formValidation.providerValue}>
          {success ? (
            <EmptyState
              title="Password Updated"
              message="Your password was reset successfully."
            />
          ) : null}

          <FormField
            label="Reset Token"
            name="token"
            required
          >
            <AppInput
              value={token}
              onChangeText={(value) => {
                formValidation.clearFieldError('token');
                setToken(value);
              }}
              autoCapitalize="none"
              placeholder="Paste reset token"
              testID="auth.reset.token"
            />
          </FormField>

          <FormField
            label="New Password"
            name="password"
            required
          >
            <AppPasswordInput
              value={password}
              onChangeText={(value) => {
                formValidation.clearFieldError('password');
                setPassword(value);
              }}
              placeholder="Enter new password"
              testID="auth.reset.password"
            />
          </FormField>

          {(error || rateLimitGuard.message) ? (
            <ErrorState
              title={rateLimitGuard.isLimited ? 'Rate Limited' : 'Reset Failed'}
              message={rateLimitGuard.message ?? error ?? ''}
            />
          ) : null}

          <AppButton
            label={rateLimitGuard.isLimited
              ? `Try again in ${rateLimitGuard.retryAfterSec}s`
              : 'Reset your password'}
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting || rateLimitGuard.isLimited}
            testID="auth.reset.submit"
          />
        </FormValidationProvider>

        <View style={styles.authLinks}>
          <AppButton
            label="Back to sign in"
            mode="text"
            tone="neutral"
            onPress={() => router.push('/(public)/auth/login')}
          />
          <AppButton
            label="Forgot password?"
            mode="text"
            tone="neutral"
            onPress={() => router.push('/(public)/forgot-password')}
          />
        </View>
      </SectionCard>

      <LoadingOverlay
        visible={submitting}
        label="Resetting password..."
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
