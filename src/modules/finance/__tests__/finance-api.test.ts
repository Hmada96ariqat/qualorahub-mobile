import {
  createFinanceGroup,
  createTransaction,
  deleteFinanceGroup,
  deleteTransaction,
  listFinanceGroups,
  listFinanceTransactions,
  reverseTransaction,
  updateFinanceGroup,
  updateTransaction,
} from '../../../api/modules/finance';

const originalFetch = global.fetch;

describe('finance api module', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses transactions from /transactions payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 'tx-1',
            type: 'expense',
            amount: '12.50',
            description: 'Fuel',
            transaction_date: '2026-03-02T00:00:00.000Z',
            finance_group_id: 'group-1',
            is_reversal: false,
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          },
        ]),
      headers: { get: () => null },
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const rows = await listFinanceTransactions('token');

    expect(rows).toEqual([
      expect.objectContaining({
        id: 'tx-1',
        type: 'expense',
        amount: 12.5,
        financeGroupId: 'group-1',
      }),
    ]);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:3300/api/v1/transactions');
    expect(options.method).toBe('GET');
  });

  it('builds transaction/group command requests and parses mutation payloads', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'tx-2',
            type: 'expense',
            amount: '22.00',
            transaction_date: '2026-03-02T00:00:00.000Z',
            finance_group_id: 'group-1',
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'tx-2',
            type: 'income',
            amount: '22.00',
            transaction_date: '2026-03-02T00:00:00.000Z',
            finance_group_id: 'group-1',
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'tx-3',
            type: 'expense',
            amount: '22.00',
            is_reversal: true,
            transaction_date: '2026-03-02T00:00:00.000Z',
            finance_group_id: 'group-1',
            original_transaction_id: 'tx-2',
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 'group-2',
            name: 'Operations',
            type: 'expense',
            created_at: '2026-03-02T00:00:00.000Z',
            updated_at: '2026-03-02T00:00:00.000Z',
          }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              id: 'group-2',
              name: 'Operations Updated',
              type: 'expense',
              created_at: '2026-03-02T00:00:00.000Z',
              updated_at: '2026-03-02T00:00:00.000Z',
            },
          ]),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              id: 'group-2',
              name: 'Operations Updated',
              type: 'expense',
              created_at: '2026-03-02T00:00:00.000Z',
              updated_at: '2026-03-02T00:00:00.000Z',
            },
          ]),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ deleted: true }),
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ deleted: true }),
        headers: { get: () => null },
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    await createTransaction('token', {
      type: 'expense',
      amount: 22,
      transaction_date: '2026-03-02',
      finance_group_id: 'group-1',
      description: 'Fuel run',
    });

    await updateTransaction('token', 'tx-2', {
      type: 'income',
      amount: 22,
      transaction_date: '2026-03-02',
      finance_group_id: 'group-1',
    });

    await reverseTransaction('token', 'tx-2', { reason: 'Duplicate charge' });

    await createFinanceGroup('token', {
      name: 'Operations',
      type: 'expense',
    });

    await updateFinanceGroup('token', 'group-2', {
      name: 'Operations Updated',
      type: 'expense',
    });

    const groups = await listFinanceGroups('token');
    expect(groups[0]?.name).toBe('Operations Updated');

    await deleteTransaction('token', 'tx-2');
    await deleteFinanceGroup('token', 'group-2');

    const [createTxUrl, createTxOptions] = fetchMock.mock.calls[0];
    const [updateTxUrl, updateTxOptions] = fetchMock.mock.calls[1];
    const [reverseTxUrl, reverseTxOptions] = fetchMock.mock.calls[2];
    const [createGroupUrl, createGroupOptions] = fetchMock.mock.calls[3];

    expect(createTxUrl).toBe('http://127.0.0.1:3300/api/v1/transactions');
    expect(createTxOptions.method).toBe('POST');
    expect(createTxOptions.headers['Idempotency-Key']).toEqual(
      expect.stringMatching(/^transactions-create-/),
    );
    expect(JSON.parse(createTxOptions.body as string)).toEqual({
      type: 'expense',
      amount: 22,
      transaction_date: '2026-03-02',
      finance_group_id: 'group-1',
      description: 'Fuel run',
    });

    expect(updateTxUrl).toBe('http://127.0.0.1:3300/api/v1/transactions/tx-2');
    expect(updateTxOptions.method).toBe('PATCH');

    expect(reverseTxUrl).toBe('http://127.0.0.1:3300/api/v1/transactions/tx-2/commands/reverse');
    expect(reverseTxOptions.method).toBe('POST');
    expect(JSON.parse(reverseTxOptions.body as string)).toEqual({ reason: 'Duplicate charge' });

    expect(createGroupUrl).toBe('http://127.0.0.1:3300/api/v1/finance-groups');
    expect(createGroupOptions.method).toBe('POST');
    expect(JSON.parse(createGroupOptions.body as string)).toEqual({
      name: 'Operations',
      type: 'expense',
    });
  });
});
