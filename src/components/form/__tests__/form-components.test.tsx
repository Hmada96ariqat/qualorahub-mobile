import React from 'react';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { AppDatePicker } from '../AppDatePicker';
import { AppSelect } from '../AppSelect';
import { AppTextArea } from '../AppTextArea';
import { FormField } from '../FormField';
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

  it('returns a date from AppDatePicker and supports clear', () => {
    const onChange = jest.fn();
    const { getByText } = renderWithProviders(
      <AppDatePicker
        value="2026-03-02"
        onChange={onChange}
      />,
    );

    fireEvent.press(getByText('2026-03-02'));
    fireEvent.press(getByText('Today'));
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));

    fireEvent.press(getByText('2026-03-02'));
    fireEvent.press(getByText('Clear date'));
    expect(onChange).toHaveBeenCalledWith(null);
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
