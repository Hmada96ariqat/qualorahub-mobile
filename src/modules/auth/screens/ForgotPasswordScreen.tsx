import React, { useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import {
  AppButton,
  AppHeader,
  AppInput,
  AppScreen,
  EmptyState,
  ErrorState,
  FormValidationProvider,
  FormField,
  LoadingOverlay,
  SectionCard,
  useFormValidation,
} from '../../../components';
import { forgotPassword } from '../api';
import { AuthRouteTabs } from '../components/AuthRouteTabs';

export function ForgotPasswordScreen() {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const formValidation = useFormValidation<'email'>(scrollViewRef);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const valid = formValidation.validate([
      {
        field: 'email',
        message: 'Email is required.',
        isValid: email.trim().length > 0,
      },
    ]);
    if (!valid) {
      setSubmitting(false);
      return;
    }

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
    <AppScreen scroll scrollViewRef={scrollViewRef}>
      <AppHeader
        title="Forgot Password"
        subtitle="Enter your email to receive reset instructions."
      />

      <AuthRouteTabs activeTab="forgot" />

      <FormValidationProvider value={formValidation.providerValue}>
        <SectionCard>
          {success ? (
            <EmptyState
              title="Request Sent"
              message="If the account exists, reset instructions were requested successfully."
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
      </FormValidationProvider>

      <LoadingOverlay
        visible={submitting}
        label="Submitting request..."
      />
    </AppScreen>
  );
}
