import type { FinanceGroup, FinanceTransaction } from '../../api/modules/finance';

export const TRANSACTION_TYPE_OPTIONS = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
] as const;

export const FINANCE_GROUP_TYPE_OPTIONS = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
] as const;

export type TransactionTypeOption = (typeof TRANSACTION_TYPE_OPTIONS)[number]['value'];
export type FinanceGroupTypeOption = (typeof FINANCE_GROUP_TYPE_OPTIONS)[number]['value'];
export type TransactionFormMode = 'create' | 'edit';
export type FinanceGroupFormMode = 'create' | 'edit';
export type TransactionListMode = 'all' | TransactionTypeOption | 'reversal';

export type TransactionFormValues = {
  type: TransactionTypeOption;
  transactionName: string;
  amount: string;
  transactionDate: string;
  financeGroupId: string;
  category: string;
  paymentMethod: string;
  referenceNumber: string;
  contactId: string;
};

export type FinanceGroupFormValues = {
  name: string;
  type: FinanceGroupTypeOption;
};

export type FinanceSummaryMetrics = {
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  transactionCount: number;
  reversalCount: number;
};

function hasLinkedTransactionId(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isReversalLinkedTransaction(
  transaction:
    | Pick<
        FinanceTransaction,
        'isReversal' | 'originalTransactionId' | 'reversalTransactionId'
      >
    | null
    | undefined,
): boolean {
  if (!transaction) return false;
  return (
    transaction.isReversal ||
    hasLinkedTransactionId(transaction.originalTransactionId) ||
    hasLinkedTransactionId(transaction.reversalTransactionId)
  );
}

function toDateOnly(value: string | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.includes('T') ? value.slice(0, 10) : value;
}

function toMoneyString(value: number): string {
  if (!Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}

export function parseAmountInput(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(safe);
}

export function normalizeTransactionType(value: string | null | undefined): TransactionTypeOption {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'income') return 'income';
  return 'expense';
}

export function normalizeFinanceGroupType(value: string | null | undefined): FinanceGroupTypeOption {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'income') return 'income';
  return 'expense';
}

export function filterFinanceGroupsByType(
  groups: FinanceGroup[],
  type: TransactionTypeOption,
): FinanceGroup[] {
  return groups.filter((group) => normalizeFinanceGroupType(group.type) === type);
}

export function matchesTransactionListMode(
  transaction: Pick<
    FinanceTransaction,
    'type' | 'isReversal' | 'originalTransactionId' | 'reversalTransactionId'
  >,
  mode: TransactionListMode,
): boolean {
  if (mode === 'all') return true;

  const reversalLinked = isReversalLinkedTransaction(transaction);
  if (mode === 'reversal') return reversalLinked;

  return !reversalLinked && normalizeTransactionType(transaction.type) === mode;
}

export function toTransactionFormValues(transaction?: FinanceTransaction | null): TransactionFormValues {
  if (!transaction) {
    return {
      type: 'expense',
      transactionName: '',
      amount: '',
      transactionDate: new Date().toISOString().slice(0, 10),
      financeGroupId: '',
      category: '',
      paymentMethod: '',
      referenceNumber: '',
      contactId: '',
    };
  }

  return {
    type: normalizeTransactionType(transaction.type),
    transactionName: transaction.description ?? '',
    amount: toMoneyString(transaction.amount),
    transactionDate: toDateOnly(transaction.transactionDate),
    financeGroupId: transaction.financeGroupId ?? '',
    category: transaction.category ?? '',
    paymentMethod: transaction.paymentMethod ?? '',
    referenceNumber: transaction.referenceNumber ?? '',
    contactId: transaction.contactId ?? '',
  };
}

export function toFinanceGroupFormValues(group?: FinanceGroup | null): FinanceGroupFormValues {
  if (!group) {
    return {
      name: '',
      type: 'expense',
    };
  }

  return {
    name: group.name,
    type: normalizeFinanceGroupType(group.type),
  };
}

export function buildFinanceSummaryMetrics(
  transactions: FinanceTransaction[],
): FinanceSummaryMetrics {
  let incomeTotal = 0;
  let expenseTotal = 0;
  let reversalCount = 0;

  for (const row of transactions) {
    const amount = Number.isFinite(row.amount) ? row.amount : 0;
    const normalizedType = normalizeTransactionType(row.type);

    if (isReversalLinkedTransaction(row)) {
      reversalCount += 1;
    }

    if (normalizedType === 'income') {
      incomeTotal += amount;
    } else {
      expenseTotal += amount;
    }
  }

  return {
    incomeTotal,
    expenseTotal,
    netTotal: incomeTotal - expenseTotal,
    transactionCount: transactions.length,
    reversalCount,
  };
}
