import React from 'react';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { AppAvatar } from '../AppAvatar';
import { AppBadge } from '../AppBadge';
import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { AppChip } from '../AppChip';
import { AppIconButton } from '../AppIconButton';
import { AppInput } from '../AppInput';
import { AppPasswordInput } from '../AppPasswordInput';
import { AppSearchInput } from '../AppSearchInput';
import { renderWithProviders } from '../../__tests__/test-utils';

describe('primitive components', () => {
  it('fires AppButton onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <AppButton
        label="Save"
        onPress={onPress}
        testID="app-button"
      />,
    );

    fireEvent.press(getByTestId('app-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders AppInput and AppPasswordInput', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <>
        <AppInput
          value=""
          onChangeText={onChangeText}
          placeholder="Email"
        />
        <AppPasswordInput
          value=""
          onChangeText={onChangeText}
          placeholder="Password"
        />
      </>,
    );

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders AppSearchInput and AppCard', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <AppCard>
        <AppSearchInput
          value=""
          onChangeText={() => undefined}
          placeholder="Search items"
        />
        <Text>Card body</Text>
      </AppCard>,
    );

    expect(getByPlaceholderText('Search items')).toBeTruthy();
    expect(getByText('Card body')).toBeTruthy();
  });

  it('fires AppIconButton onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <AppIconButton
        icon="close"
        onPress={onPress}
        accessibilityLabel="Close"
        testID="app-icon-button"
      />,
    );

    fireEvent.press(getByTestId('app-icon-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders AppBadge and AppAvatar fallback initials', () => {
    const { getByText } = renderWithProviders(
      <>
        <AppBadge value={3} />
        <AppAvatar label="Qualora Hub" />
      </>,
    );

    expect(getByText('3')).toBeTruthy();
    expect(getByText('QH')).toBeTruthy();
  });

  it('fires AppChip onPress', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <AppChip
        label="Operations"
        onPress={onPress}
      />,
    );

    fireEvent.press(getByText('Operations'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
