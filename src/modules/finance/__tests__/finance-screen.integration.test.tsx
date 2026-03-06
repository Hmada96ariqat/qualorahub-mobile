import React from 'react';
import { fireEvent, waitFor, within } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import { FinanceScreen } from '../screens/FinanceScreen';
import { useFinanceModule } from '../useFinanceModule.hook';

jest.mock('../useFinanceModule.hook', () => ({
  useFinanceModule: jest.fn(),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <FinanceScreen />
    </ToastProvider>,
  );
}

describe('FinanceScreen integration', () => {
  const useFinanceModuleMock = jest.mocked(useFinanceModule);
  const createTransactionMock = jest.fn();
  const updatedTransaction = {
    id: 'tx-updated',
    type: 'expense',
    amount: 30,
    description: 'Fuel Fill',
    category: null,
    paymentMethod: null,
    referenceNumber: null,
    transactionDate: '2026-03-02',
    contactId: null,
    financeGroupId: 'group-expense',
    originalTransactionId: null,
    reversalTransactionId: null,
    isReversal: false,
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
  };
  const reversedTransaction = {
    id: 'tx-reversed',
    type: 'expense',
    amount: 30,
    description: 'Fuel Fill Reversal',
    category: null,
    paymentMethod: null,
    referenceNumber: null,
    transactionDate: '2026-03-03',
    contactId: null,
    financeGroupId: 'group-expense',
    originalTransactionId: 'tx-expense',
    reversalTransactionId: null,
    isReversal: true,
    createdAt: '2026-03-03T00:00:00.000Z',
    updatedAt: '2026-03-03T00:00:00.000Z',
  };
  const financeGroup = {
    id: 'group-expense',
    name: 'Operations',
    type: 'expense',
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
  };

  function buildHookResult(): ReturnType<typeof useFinanceModule> {
    return {
      transactions: [
        {
          id: 'tx-income',
          type: 'income',
          amount: 120,
          description: 'Salary March',
          category: 'payroll',
          paymentMethod: null,
          referenceNumber: null,
          transactionDate: '2026-03-02',
          contactId: null,
          financeGroupId: 'group-income',
          originalTransactionId: null,
          reversalTransactionId: null,
          isReversal: false,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
        {
          id: 'tx-expense',
          type: 'expense',
          amount: 30,
          description: 'Fuel Fill',
          category: 'transport',
          paymentMethod: null,
          referenceNumber: null,
          transactionDate: '2026-03-02',
          contactId: null,
          financeGroupId: 'group-expense',
          originalTransactionId: null,
          reversalTransactionId: null,
          isReversal: false,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
        {
          id: 'tx-reversal',
          type: 'expense',
          amount: 30,
          description: 'Fuel Fill Reversal',
          category: 'transport',
          paymentMethod: null,
          referenceNumber: null,
          transactionDate: '2026-03-03',
          contactId: null,
          financeGroupId: 'group-expense',
          originalTransactionId: 'tx-expense',
          reversalTransactionId: null,
          isReversal: true,
          createdAt: '2026-03-03T00:00:00.000Z',
          updatedAt: '2026-03-03T00:00:00.000Z',
        },
        {
          id: 'tx-linked',
          type: 'expense',
          amount: 44,
          description: 'Locked Expense',
          category: 'ops',
          paymentMethod: null,
          referenceNumber: null,
          transactionDate: '2026-03-04',
          contactId: null,
          financeGroupId: 'group-expense',
          originalTransactionId: null,
          reversalTransactionId: 'tx-reversal',
          isReversal: false,
          createdAt: '2026-03-04T00:00:00.000Z',
          updatedAt: '2026-03-04T00:00:00.000Z',
        },
      ],
      financeGroups: [
        {
          id: 'group-income',
          name: 'Sales',
          type: 'income',
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
        {
          id: 'group-expense',
          name: 'Operations',
          type: 'expense',
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      errorMessage: null,
      refresh: async () => undefined,
      createTransaction: createTransactionMock,
      updateTransaction: async () => updatedTransaction,
      deleteTransaction: async () => undefined,
      reverseTransaction: async () => reversedTransaction,
      createFinanceGroup: async () => financeGroup,
      updateFinanceGroup: async () => financeGroup,
      deleteFinanceGroup: async () => undefined,
    };
  }

  beforeEach(() => {
    createTransactionMock.mockReset();
    createTransactionMock.mockResolvedValue({
      id: 'tx-created',
      type: 'income',
      amount: 250,
      description: 'Crop Sale',
      category: null,
      paymentMethod: null,
      referenceNumber: null,
      transactionDate: '2026-03-05',
      contactId: null,
      financeGroupId: 'group-income',
      originalTransactionId: null,
      reversalTransactionId: null,
      isReversal: false,
      createdAt: '2026-03-05T00:00:00.000Z',
      updatedAt: '2026-03-05T00:00:00.000Z',
    });

    useFinanceModuleMock.mockReturnValue(buildHookResult());
  });

  it('applies strict tabs, removes the reversal banner, and searches by transaction name only', () => {
    const { getByPlaceholderText, getByText, queryByText } = renderScreen();

    expect(queryByText('1 reversal on record')).toBeNull();
    expect(queryByText('Tap to filter reversal transactions.')).toBeNull();

    fireEvent.press(getByText('Income (1)'));
    expect(queryByText('Salary March')).not.toBeNull();
    expect(queryByText('Fuel Fill')).toBeNull();
    expect(queryByText('Fuel Fill Reversal')).toBeNull();
    expect(queryByText('Locked Expense')).toBeNull();

    fireEvent.press(getByText('Expense (1)'));
    expect(queryByText('Fuel Fill')).not.toBeNull();
    expect(queryByText('Salary March')).toBeNull();
    expect(queryByText('Fuel Fill Reversal')).toBeNull();
    expect(queryByText('Locked Expense')).toBeNull();

    fireEvent.press(getByText('Reversals (2)'));
    expect(queryByText('Fuel Fill Reversal')).not.toBeNull();
    expect(queryByText('Locked Expense')).not.toBeNull();
    expect(queryByText('Salary March')).toBeNull();
    expect(queryByText('Fuel Fill')).toBeNull();

    fireEvent.press(getByText('All (4)'));
    const searchInput = getByPlaceholderText('Search transaction name...');
    fireEvent.changeText(searchInput, 'payroll');
    expect(queryByText('Salary March')).toBeNull();
    expect(queryByText('No transactions found')).not.toBeNull();

    fireEvent.changeText(searchInput, 'Salary');
    expect(queryByText('Salary March')).not.toBeNull();
  });

  it('requires transaction name and filters finance groups by the selected transaction type', async () => {
    const { getByTestId, queryByTestId } = renderScreen();

    fireEvent.press(getByTestId('finance-header-create-transaction'));

    const amountInput = getByTestId('finance-form-amount');
    const groupSelect = getByTestId('finance-form-group-select');
    fireEvent.changeText(amountInput, '250');

    fireEvent.press(within(groupSelect).getByText('Select finance group'));
    expect(queryByTestId('app-select-option-group-expense')).not.toBeNull();
    expect(queryByTestId('app-select-option-group-income')).toBeNull();
    fireEvent.press(getByTestId('app-select-option-group-expense'));

    fireEvent.press(getByTestId('finance-transaction-submit'));
    await waitFor(() => expect(createTransactionMock).not.toHaveBeenCalled());

    const typeSelect = getByTestId('finance-form-type-select');
    fireEvent.press(within(typeSelect).getByText('Expense'));
    fireEvent.press(getByTestId('app-select-option-income'));

    expect(within(groupSelect).queryByText('Select finance group')).not.toBeNull();

    fireEvent.press(within(groupSelect).getByText('Select finance group'));
    expect(queryByTestId('app-select-option-group-income')).not.toBeNull();
    expect(queryByTestId('app-select-option-group-expense')).toBeNull();
    fireEvent.press(getByTestId('app-select-option-group-income'));

    fireEvent.changeText(getByTestId('finance-form-transaction-name'), '  Crop Sale  ');
    fireEvent.press(getByTestId('finance-transaction-submit'));

    await waitFor(() => {
      expect(createTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'income',
          description: 'Crop Sale',
          amount: 250,
          finance_group_id: 'group-income',
        }),
      );
    });
  });

  it('shows reversal-linked transactions as view only', () => {
    const { getByText, queryByText } = renderScreen();

    fireEvent.press(getByText('Locked Expense'));

    expect(queryByText('This transaction is view only.')).not.toBeNull();
    expect(queryByText('Edit')).toBeNull();
    expect(queryByText('Reverse')).toBeNull();
    expect(queryByText('Delete')).toBeNull();
  });
});
