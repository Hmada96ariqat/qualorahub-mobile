import {
  buildFinanceSummaryMetrics,
  parseAmountInput,
  toFinanceGroupFormValues,
  toTransactionFormValues,
} from '../contracts';

describe('finance contracts', () => {
  it('parses amount input safely', () => {
    expect(parseAmountInput('12.55')).toBe(12.55);
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
  });

  it('builds finance summary metrics', () => {
    const summary = buildFinanceSummaryMetrics([
      {
        id: 'tx-1',
        type: 'income',
        amount: 100,
        description: 'Income',
        category: null,
        paymentMethod: null,
        referenceNumber: null,
        transactionDate: '2026-03-02',
        contactId: null,
        financeGroupId: 'group-1',
        originalTransactionId: null,
        reversalTransactionId: null,
        isReversal: false,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
      {
        id: 'tx-2',
        type: 'expense',
        amount: 35,
        description: 'Expense',
        category: null,
        paymentMethod: null,
        referenceNumber: null,
        transactionDate: '2026-03-02',
        contactId: null,
        financeGroupId: 'group-2',
        originalTransactionId: 'tx-1',
        reversalTransactionId: null,
        isReversal: true,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
    ]);

    expect(summary).toEqual({
      incomeTotal: 100,
      expenseTotal: 35,
      netTotal: 65,
      transactionCount: 2,
      reversalCount: 1,
    });
  });

  it('maps transaction and group payloads into form values', () => {
    expect(
      toTransactionFormValues({
        id: 'tx-1',
        type: 'income',
        amount: 11.5,
        description: 'Coffee sale',
        category: 'sales',
        paymentMethod: 'cash',
        referenceNumber: 'INV-1',
        transactionDate: '2026-03-02T00:00:00.000Z',
        contactId: 'contact-1',
        financeGroupId: 'group-1',
        originalTransactionId: null,
        reversalTransactionId: null,
        isReversal: false,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      }),
    ).toMatchObject({
      type: 'income',
      amount: '11.50',
      financeGroupId: 'group-1',
      description: 'Coffee sale',
      transactionDate: '2026-03-02',
    });

    expect(
      toFinanceGroupFormValues({
        id: 'group-1',
        name: 'Sales',
        type: 'income',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      }),
    ).toEqual({
      name: 'Sales',
      type: 'income',
    });
  });
});
