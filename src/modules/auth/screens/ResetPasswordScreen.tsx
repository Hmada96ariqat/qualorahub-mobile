import React, { useState } from 'react';
import {
  AppButton,
  AppHeader,
  AppInput,
  AppPasswordInput,
  AppScreen,
  EmptyState,
  ErrorState,
  FormField,
  LoadingOverlay,
  SectionCard,
} from '../../../components';
import { resetPassword } from '../api';
import { AuthRouteTabs } from '../components/AuthRouteTabs';

export function ResetPasswordScreen() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

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
    <AppScreen scroll>
      <AppHeader
        title="Reset Password"
        subtitle="Enter your reset token and a new password."
      />

      <AuthRouteTabs activeTab="reset" />

      <SectionCard>
        {success ? (
          <EmptyState
            title="Password Updated"
            message="Your password was reset successfully."
          />
        ) : null}

        <FormField
          label="Reset Token"
          required
        >
          <AppInput
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            placeholder="Paste reset token"
            testID="auth.reset.token"
          />
        </FormField>

        <FormField
          label="New Password"
          required
        >
          <AppPasswordInput
            value={password}
            onChangeText={setPassword}
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

      <LoadingOverlay
        visible={submitting}
        label="Resetting password..."
      />
    </AppScreen>
  );
}
