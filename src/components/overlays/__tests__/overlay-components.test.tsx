import React from 'react';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { ActionSheet } from '../ActionSheet';
import { BottomSheet } from '../BottomSheet';
import { ConfirmDialog } from '../ConfirmDialog';
import { renderWithProviders } from '../../__tests__/test-utils';

describe('overlay components', () => {
  it('fires confirm action in ConfirmDialog', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId } = renderWithProviders(
      <ConfirmDialog
        visible
        title="Delete item"
        message="This action cannot be undone."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(getByTestId('confirm-dialog.confirm'));
    fireEvent.press(getByTestId('confirm-dialog.cancel'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('fires action and dismiss in ActionSheet', () => {
    const onDismiss = jest.fn();
    const onArchive = jest.fn();
    const { getByText } = renderWithProviders(
      <ActionSheet
        visible
        title="Task actions"
        actions={[
          {
            key: 'archive',
            label: 'Archive task',
            onPress: onArchive,
          },
        ]}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.press(getByText('Archive task'));
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders BottomSheet content and footer', () => {
    const { getByText } = renderWithProviders(
      <BottomSheet
        visible
        title="Filters"
        onDismiss={() => undefined}
        footer={<Text>Footer actions</Text>}
      >
        <Text>Sheet body</Text>
      </BottomSheet>,
    );

    expect(getByText('Filters')).toBeTruthy();
    expect(getByText('Sheet body')).toBeTruthy();
    expect(getByText('Footer actions')).toBeTruthy();
  });

  it('renders scroll containers for overlay content', () => {
    const actionView = renderWithProviders(
      <ActionSheet
        visible
        title="Scrollable actions"
        actions={[{ key: 'one', label: 'One', onPress: () => undefined }]}
        onDismiss={() => undefined}
        testID="actions"
      />,
    );
    expect(actionView.getByTestId('actions.scroll')).toBeTruthy();

    const bottomView = renderWithProviders(
      <BottomSheet
        visible
        title="Scrollable sheet"
        onDismiss={() => undefined}
        testID="sheet"
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    expect(bottomView.getByTestId('sheet.scroll')).toBeTruthy();

    const confirmView = renderWithProviders(
      <ConfirmDialog
        visible
        title="Long confirm"
        message={'Line '.repeat(80)}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        testID="confirm"
      />,
    );
    expect(confirmView.getByTestId('confirm.scroll')).toBeTruthy();
  });
});
