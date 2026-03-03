import React from 'react';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { AppListItem } from '../AppListItem';
import { FilterBar } from '../FilterBar';
import { PaginationFooter } from '../PaginationFooter';
import { PullToRefreshContainer } from '../PullToRefreshContainer';
import { renderWithProviders } from '../../__tests__/test-utils';

describe('list components', () => {
  it('renders PullToRefreshContainer content', () => {
    const { getByText } = renderWithProviders(
      <PullToRefreshContainer
        refreshing={false}
        onRefresh={() => undefined}
      >
        <Text>List body</Text>
      </PullToRefreshContainer>,
    );

    expect(getByText('List body')).toBeTruthy();
  });

  it('fires PaginationFooter callbacks', () => {
    const onPageChange = jest.fn();
    const { getByText } = renderWithProviders(
      <PaginationFooter
        page={2}
        pageSize={10}
        totalItems={30}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.press(getByText('Previous'));
    fireEvent.press(getByText('Next'));
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('renders FilterBar search input', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <FilterBar
        searchValue=""
        onSearchChange={() => undefined}
        searchPlaceholder="Search modules"
      />,
    );

    expect(getByPlaceholderText('Search modules')).toBeTruthy();
  });

  it('fires AppListItem onPress', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <AppListItem
        title="Field A"
        description="North Zone"
        onPress={onPress}
      />,
    );

    fireEvent.press(getByText('Field A'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
