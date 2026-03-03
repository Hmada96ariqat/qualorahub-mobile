import React, { useState } from 'react';
import {
  AppButton,
  AppHeader,
  AppInput,
  AppScreen,
  EmptyState,
  ErrorState,
  FormField,
  LoadingOverlay,
  SectionCard,
} from '../../../components';
import { forgotPassword } from '../api';
import { AuthRouteTabs } from '../components/AuthRouteTabs';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await forgotPassword({ email: email.trim() });
      setSuccess(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to submit reset request';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="Forgot Password"
        subtitle="Enter your email to receive reset instructions."
      />

      <AuthRouteTabs activeTab="forgot" />

      <SectionCard>
        {success ? (
          <EmptyState
            title="Request Sent"
            message="If the account exists, reset instructions were requested successfully."
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
            testID="auth.forgot.email"
          />
        </FormField>

        {error ? (
          <ErrorState
            title="Request Failed"
            message={error}
          />
        ) : null}

        <AppButton
          label="Submit"
          onPress={onSubmit}
          loading={submitting}
          disabled={submitting}
          testID="auth.forgot.submit"
        />
      </SectionCard>

      <LoadingOverlay
        visible={submitting}
        label="Submitting request..."
      />
    </AppScreen>
  );
}
