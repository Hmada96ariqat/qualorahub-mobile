import React, { useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import {
  AppButton,
  AppHeader,
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
import { resetPassword } from '../api';
import { AuthRouteTabs } from '../components/AuthRouteTabs';

export function ResetPasswordScreen() {
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
      await resetPassword({
        token: token.trim(),
        password,
      });
      setSuccess(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to reset password';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen scroll scrollViewRef={scrollViewRef}>
      <AppHeader
        title="Reset Password"
        subtitle="Enter your reset token and a new password."
      />

      <AuthRouteTabs activeTab="reset" />

      <FormValidationProvider value={formValidation.providerValue}>
        <SectionCard>
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

          {error ? (
            <ErrorState
              title="Reset Failed"
              message={error}
            />
          ) : null}

          <AppButton
            label="Reset Password"
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting}
            testID="auth.reset.submit"
          />
        </SectionCard>
      </FormValidationProvider>

      <LoadingOverlay
        visible={submitting}
        label="Resetting password..."
      />
    </AppScreen>
  );
}
