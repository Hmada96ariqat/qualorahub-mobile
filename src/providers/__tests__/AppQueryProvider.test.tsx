import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { AppQueryProvider, appQueryClient } from '../AppQueryProvider';

describe('AppQueryProvider', () => {
  it('renders children inside query provider', () => {
    const { getByText } = render(
      <AppQueryProvider>
        <Text>query child</Text>
      </AppQueryProvider>,
    );

    expect(getByText('query child')).toBeTruthy();
  });

  it('uses hardening defaults for queries and mutations', () => {
    const defaults = appQueryClient.getDefaultOptions();

    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.gcTime).toBe(300_000);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.retry).toBe(0);
  });
});
