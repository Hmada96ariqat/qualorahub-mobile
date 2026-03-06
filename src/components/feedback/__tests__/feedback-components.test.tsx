import React from 'react';
import { Button } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { Snackbar } from 'react-native-paper';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { LoadingOverlay } from '../LoadingOverlay';
import { NetworkStatusBanner } from '../NetworkStatusBanner';
import { Skeleton } from '../Skeleton';
import { ToastProvider, useToast } from '../ToastProvider';
import { renderWithProviders } from '../../__tests__/test-utils';

function ToastProbe() {
  const { showToast } = useToast();

  return (
    <Button
      title="Show toast"
      onPress={() =>
        showToast({
          message: 'Saved',
          variant: 'success',
        })
      }
    />
  );
}

describe('feedback components', () => {
  it('renders EmptyState with action', () => {
    const onAction = jest.fn();
    const { getByText } = renderWithProviders(
      <EmptyState
        title="No data"
        message="Try again later"
        actionLabel="Retry"
        onAction={onAction}
      />,
    );

    fireEvent.press(getByText('Retry'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders ErrorState and triggers retry', () => {
    const onRetry = jest.fn();
    const { getByText } = renderWithProviders(
      <ErrorState
        message="Network error"
        onRetry={onRetry}
      />,
    );

    fireEvent.press(getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders Skeleton and LoadingOverlay', () => {
    const { getByTestId } = renderWithProviders(
      <>
        <Skeleton testID="skeleton" />
        <LoadingOverlay visible label="Loading" testID="loading-overlay" />
      </>,
    );

    expect(getByTestId('skeleton')).toBeTruthy();
    expect(getByTestId('loading-overlay')).toBeTruthy();
  });

  it('renders NetworkStatusBanner when offline', () => {
    const onRetry = jest.fn();
    const { getByText } = renderWithProviders(
      <NetworkStatusBanner
        isOnline={false}
        actionLabel="Retry"
        onAction={onRetry}
      />,
    );

    fireEvent.press(getByText('Retry'));
    expect(getByText('You are offline. Some actions may be unavailable.')).toBeTruthy();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows toast message through ToastProvider', () => {
    const { UNSAFE_getByType, getByText } = renderWithProviders(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );

    fireEvent.press(getByText('Show toast'));
    expect(getByText('Saved')).toBeTruthy();
    expect(UNSAFE_getByType(Snackbar).props.duration).toBe(5000);
  });
});
