import React from 'react';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../__tests__/test-utils';
import { ModuleAccessGate } from '../ModuleAccessGate';

describe('ModuleAccessGate', () => {
  it('shows loading overlay while permissions are resolving', () => {
    const { getByText } = renderWithProviders(
      <ModuleAccessGate
        loading
        allowed={false}
        moduleLabel="Crops"
        onSignOut={jest.fn()}
      >
        <Text>content</Text>
      </ModuleAccessGate>,
    );

    expect(getByText('Loading crops access...')).toBeTruthy();
  });

  it('renders children when access is allowed', () => {
    const { getByText, queryByText } = renderWithProviders(
      <ModuleAccessGate
        loading={false}
        allowed
        moduleLabel="Dashboard"
        onSignOut={jest.fn()}
      >
        <Text>allowed content</Text>
      </ModuleAccessGate>,
    );

    expect(getByText('allowed content')).toBeTruthy();
    expect(queryByText('Dashboard Access Locked')).toBeNull();
  });

  it('renders lock state and handles sign-out action when access is denied', () => {
    const onSignOut = jest.fn();
    const { getByText } = renderWithProviders(
      <ModuleAccessGate
        loading={false}
        allowed={false}
        moduleLabel="Finance"
        onSignOut={onSignOut}
      >
        <Text>forbidden content</Text>
      </ModuleAccessGate>,
    );

    expect(getByText('Finance Access Locked')).toBeTruthy();
    fireEvent.press(getByText('Sign Out'));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
