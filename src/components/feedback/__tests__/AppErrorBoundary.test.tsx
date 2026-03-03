import React from 'react';
import { Text } from 'react-native';
import { renderWithProviders } from '../../__tests__/test-utils';
import { AppErrorBoundary } from '../AppErrorBoundary';
import { reportAppError } from '../../../utils/observability';

jest.mock('../../../utils/observability', () => ({
  reportAppError: jest.fn(),
}));

function CrashComponent({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) {
    throw new Error('render crash');
  }

  return <Text>screen ok</Text>;
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders fallback UI and reports render errors', () => {
    const { getByText } = renderWithProviders(
      <AppErrorBoundary>
        <CrashComponent shouldCrash />
      </AppErrorBoundary>,
    );

    expect(getByText('Unexpected Application Error')).toBeTruthy();
    expect(reportAppError).toHaveBeenCalledTimes(1);
    expect(getByText('Reload Screen')).toBeTruthy();
  });

  it('renders child content when no error occurs', () => {
    const { getByText } = renderWithProviders(
      <AppErrorBoundary>
        <CrashComponent shouldCrash={false} />
      </AppErrorBoundary>,
    );

    expect(getByText('screen ok')).toBeTruthy();
  });
});
