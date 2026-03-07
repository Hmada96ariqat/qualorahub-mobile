import React, { useRef, useState } from 'react';
import { StyleSheet, View, type ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppButton,
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
import { spacing } from '../../../theme/tokens';
import { forgotPassword } from '../api';
import { AuthBrandHeader } from '../components/AuthBrandHeader';

export function ForgotPasswordScreen() {
  const router = useRouter();
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
    <AppScreen
      scroll
      scrollViewRef={scrollViewRef}
      contentContainerStyle={styles.screenContent}
    >
      <AuthBrandHeader subtitle="Enter your email to receive reset instructions." />

      <SectionCard>
        <FormValidationProvider value={formValidation.providerValue}>
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
            label="Send Reset Link"
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting}
            testID="auth.forgot.submit"
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
            label="Reset your password"
            mode="text"
            tone="neutral"
            onPress={() => router.push('/(public)/reset-password')}
          />
        </View>
      </SectionCard>

      <LoadingOverlay
        visible={submitting}
        label="Submitting request..."
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
