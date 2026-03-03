import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import { AuthRouteTabs } from '../components/AuthRouteTabs';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('AuthRouteTabs', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('routes to forgot password from login tab', () => {
    const { getByText } = renderWithProviders(<AuthRouteTabs activeTab="login" />);

    fireEvent.press(getByText('Forgot'));
    expect(mockReplace).toHaveBeenCalledWith('/(public)/forgot-password');
  });

  it('routes to reset password from forgot tab', () => {
    const { getByText } = renderWithProviders(<AuthRouteTabs activeTab="forgot" />);

    fireEvent.press(getByText('Reset'));
    expect(mockReplace).toHaveBeenCalledWith('/(public)/reset-password');
  });

  it('routes to login from reset tab', () => {
    const { getByText } = renderWithProviders(<AuthRouteTabs activeTab="reset" />);

    fireEvent.press(getByText('Login'));
    expect(mockReplace).toHaveBeenCalledWith('/(public)/auth/login');
  });
});
