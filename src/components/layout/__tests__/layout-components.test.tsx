import React from 'react';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { AppHeader } from '../AppHeader';
import { AppScreen } from '../AppScreen';
import { AppSection } from '../AppSection';
import { AppTabs } from '../AppTabs';
import { SectionCard } from '../SectionCard';
import { renderWithProviders } from '../../__tests__/test-utils';

describe('layout components', () => {
  it('renders AppScreen content', () => {
    const { getByText } = renderWithProviders(
      <AppScreen>
        <Text>Screen body</Text>
      </AppScreen>,
    );

    expect(getByText('Screen body')).toBeTruthy();
  });

  it('renders AppHeader title and subtitle', () => {
    const { getByText } = renderWithProviders(
      <AppHeader
        title="Header title"
        subtitle="Header subtitle"
      />,
    );

    expect(getByText('Header title')).toBeTruthy();
    expect(getByText('Header subtitle')).toBeTruthy();
  });

  it('renders AppSection and SectionCard', () => {
    const { getByText } = renderWithProviders(
      <SectionCard>
        <AppSection
          title="Section title"
          description="Section description"
        >
          <Text>Section body</Text>
        </AppSection>
      </SectionCard>,
    );

    expect(getByText('Section title')).toBeTruthy();
    expect(getByText('Section description')).toBeTruthy();
    expect(getByText('Section body')).toBeTruthy();
  });

  it('fires AppTabs value change', () => {
    const onValueChange = jest.fn();
    const { getByText } = renderWithProviders(
      <AppTabs
        value="context"
        onValueChange={onValueChange}
        tabs={[
          { value: 'context', label: 'Context' },
          { value: 'access', label: 'Access' },
        ]}
      />,
    );

    fireEvent.press(getByText('Access'));
    expect(onValueChange).toHaveBeenCalledWith('access');
  });

  it('does not fire AppTabs value change for disabled tab', () => {
    const onValueChange = jest.fn();
    const { getByText } = renderWithProviders(
      <AppTabs
        value="context"
        onValueChange={onValueChange}
        tabs={[
          { value: 'context', label: 'Context' },
          { value: 'access', label: 'Access', disabled: true },
        ]}
      />,
    );

    fireEvent.press(getByText('Access'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
