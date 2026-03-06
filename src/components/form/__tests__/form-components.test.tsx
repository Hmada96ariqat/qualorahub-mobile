import React from 'react';
import { Text } from 'react-native';
import { useState } from 'react';
import { fireEvent } from '@testing-library/react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { AppDatePicker } from '../AppDatePicker';
import { AppSelect } from '../AppSelect';
import { AppTextArea } from '../AppTextArea';
import { FormField } from '../FormField';
import { FormValidationProvider } from '../FormValidation';
import { renderWithProviders } from '../../__tests__/test-utils';

describe('form components', () => {
  it('renders FormField helper and error states', () => {
    const helperView = renderWithProviders(
      <FormField
        label="Email"
        helperText="We never share your email"
      >
        <Text>Field Control</Text>
      </FormField>,
    );

    expect(helperView.getByText('Email')).toBeTruthy();
    expect(helperView.getByText('We never share your email')).toBeTruthy();
    expect(helperView.getByText('Field Control')).toBeTruthy();

    const errorView = renderWithProviders(
      <FormField
        label="Email"
        errorText="Email is required"
      >
        <Text>Field Control</Text>
      </FormField>,
    );

    expect(errorView.getByText('Email is required')).toBeTruthy();
    expect(errorView.queryByText('We never share your email')).toBeNull();
  });

  it('renders required markers and provider validation errors', () => {
    const view = renderWithProviders(
      <FormValidationProvider
        value={{
          errors: { email: 'Email is required' },
          registerFieldLayout: jest.fn(),
        }}
      >
        <FormField label="Email" name="email" required>
          <Text>Field Control</Text>
        </FormField>
      </FormValidationProvider>,
    );

    expect(view.getByText('Email *')).toBeTruthy();
    expect(view.getByText('Email is required')).toBeTruthy();
  });

  it('selects an option from AppSelect', () => {
    const onChange = jest.fn();
    const { getByText, getByTestId } = renderWithProviders(
      <AppSelect
        value={null}
        onChange={onChange}
        options={[
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ]}
      />,
    );

    fireEvent.press(getByText('Select an option'));
    fireEvent.press(getByTestId('app-select-option-open'));
    expect(onChange).toHaveBeenCalledWith('open');
  });

  it('supports searchable options and create action in AppSelect', () => {
    const onChange = jest.fn();
    const onCreateOption = jest.fn();
    const { getByText, getByTestId, getByPlaceholderText } = renderWithProviders(
      <AppSelect
        value={null}
        onChange={onChange}
        searchable
        onCreateOption={onCreateOption}
        options={[
          { label: 'Alpha option', value: 'alpha' },
          { label: 'Beta option', value: 'beta' },
        ]}
      />,
    );

    fireEvent.press(getByText('Select an option'));
    fireEvent.changeText(getByPlaceholderText('Search options'), 'Beta');
    fireEvent.press(getByTestId('app-select-option-beta'));
    expect(onChange).toHaveBeenCalledWith('beta');

    fireEvent.press(getByText('Select an option'));
    fireEvent.press(getByText('Create new'));
    expect(onCreateOption).toHaveBeenCalledTimes(1);
  });

  it('opens AppDatePicker, applies a selected date, and supports clear', () => {
    function Harness() {
      const [value, setValue] = useState<string | null>(null);
      return <AppDatePicker value={value} onChange={setValue} testID="date-picker" />;
    }

    const { getAllByText, getByTestId, getByText, queryByText } = renderWithProviders(<Harness />);

    expect(getAllByText('Pick a date').length).toBeGreaterThan(0);
    fireEvent.press(getByTestId('date-picker.trigger'));
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Tomorrow')).toBeTruthy();
    expect(queryByText('In 7 days')).toBeNull();

    fireEvent.press(getByTestId('date-picker.native.set-date'));
    fireEvent.press(getByTestId('date-picker.apply'));
    expect(getAllByText('2026-03-05').length).toBeGreaterThan(0);

    fireEvent.press(getByTestId('date-picker.trigger'));
    fireEvent.press(getByTestId('date-picker.clear'));
    expect(getAllByText('Pick a date').length).toBeGreaterThan(0);
  });

  it('uses the native Android picker config when opened on Android', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(require('react-native').Platform, 'OS');
    Object.defineProperty(require('react-native').Platform, 'OS', {
      configurable: true,
      value: 'android',
    });

    const androidOpenMock = jest.mocked(DateTimePickerAndroid.open);
    androidOpenMock.mockClear();

    try {
      const { getByTestId } = renderWithProviders(
        <AppDatePicker value={null} onChange={jest.fn()} testID="android-date-picker" />,
      );

      fireEvent.press(getByTestId('android-date-picker.trigger'));

      expect(androidOpenMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Pick a date',
          mode: 'date',
          neutralButton: { label: 'Clear date' },
        }),
      );
    } finally {
      if (originalPlatform) {
        Object.defineProperty(require('react-native').Platform, 'OS', originalPlatform);
      }
    }
  });

  it('renders AppTextArea and handles text updates', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <AppTextArea
        value=""
        onChangeText={onChangeText}
        placeholder="Notes"
      />,
    );

    fireEvent.changeText(getByPlaceholderText('Notes'), 'Initial text');
    expect(onChangeText).toHaveBeenCalledWith('Initial text');
  });
});
