import React from 'react';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import { AuthBrandHeader } from '../components/AuthBrandHeader';

describe('AuthBrandHeader', () => {
  it('renders the app brand and subtitle', () => {
    const { getByText, getByLabelText } = renderWithProviders(
      <AuthBrandHeader subtitle="Sign in to continue" />,
    );

    expect(getByText('QualoraHub')).toBeTruthy();
    expect(getByText('Sign in to continue')).toBeTruthy();
    expect(getByLabelText('QualoraHub logo')).toBeTruthy();
  });
});
