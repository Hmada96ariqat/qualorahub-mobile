import React from 'react';
import { Text } from 'react-native';
import { PermissionGate } from '../PermissionGate';
import { renderWithProviders } from '../../__tests__/test-utils';

describe('PermissionGate', () => {
  it('renders children when allowed', () => {
    const { getByText } = renderWithProviders(
      <PermissionGate allowed>
        <Text>Allowed Content</Text>
      </PermissionGate>,
    );

    expect(getByText('Allowed Content')).toBeTruthy();
  });

  it('renders fallback when not allowed', () => {
    const { getByText, queryByText } = renderWithProviders(
      <PermissionGate
        allowed={false}
        fallback={<Text>Blocked</Text>}
      >
        <Text>Allowed Content</Text>
      </PermissionGate>,
    );

    expect(getByText('Blocked')).toBeTruthy();
    expect(queryByText('Allowed Content')).toBeNull();
  });
});
