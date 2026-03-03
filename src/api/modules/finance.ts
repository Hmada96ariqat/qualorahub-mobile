import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import {
  isRecord,
  normalizeRows,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';

type CreateTransactionRequestContract =
  operations['OrderWriteController_createTransaction_v1']['requestBody']['content']['application/json'];
type UpdateTransactionRequestContract =
  operations['OrderWriteController_updateTransaction_v1']['requestBody']['content']['application/json'];
type ReverseTransactionRequestContract =
  operations['OrderWriteController_reverseTransaction_v1']['requestBody']['content']['application/json'];
type CreateFinanceGroupRequestContract =
  operations['OrderWriteController_createFinanceGroup_v1']['requestBody']['content']['application/json'];
type UpdateFinanceGroupRequestContract =
  operations['OrderWriteController_updateFinanceGroup_v1']['requestBody']['content']['application/json'];

type ListTransactionsResponseContract =
  operations['OrderWriteController_listTransactions_v1']['responses'][200]['content']['application/json'];
type CreateTransactionResponseContract =
  operations['OrderWriteController_createTransaction_v1']['responses'][201]['content']['application/json'];
type UpdateTransactionResponseContract =
  operations['OrderWriteController_updateTransaction_v1']['responses'][200]['content']['application/json'];
type ReverseTransactionResponseContract =
  operations['OrderWriteController_reverseTransaction_v1']['responses'][200]['content']['application/json'];
type ListFinanceGroupsResponseContract =
  operations['OrderWriteController_listFinanceGroups_v1']['responses'][200]['content']['application/json'];
type CreateFinanceGroupResponseContract =
  operations['OrderWriteController_createFinanceGroup_v1']['responses'][201]['content']['application/json'];
type UpdateFinanceGroupResponseContract =
  operations['OrderWriteController_updateFinanceGroup_v1']['responses'][200]['content']['application/json'];

type TransactionRequest = CreateTransactionRequestContract | UpdateTransactionRequestContract;

export type CreateTransactionRequest = CreateTransactionRequestContract;
export type UpdateTransactionRequest = UpdateTransactionRequestContract;
export type ReverseTransactionRequest = ReverseTransactionRequestContract;
export type CreateFinanceGroupRequest = CreateFinanceGroupRequestContract;
export type UpdateFinanceGroupRequest = UpdateFinanceGroupRequestContract;

export type FinanceTransactionType = 'income' | 'expense' | string;

export type FinanceTransaction = {
  id: string;
  type: FinanceTransactionType;
  amount: number;
  description: string | null;
  category: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  transactionDate: string | null;
  contactId: string | null;
  financeGroupId: string | null;
  originalTransactionId: string | null;
  reversalTransactionId: string | null;
  isReversal: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceGroupType = 'income' | 'expense' | string;

export type FinanceGroup = {
  id: string;
  name: string;
  type: FinanceGroupType;
  createdAt: string;
  updatedAt: string;
};

function readFirstString(record: UnknownRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = readString(record, key);
    if (value.length > 0) return value;
  }
  return fallback;
}

function readFirstNullableString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = readNullableString(record, key);
    if (value !== null) return value;
  }
  return null;
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function parseFinanceTransaction(payload: unknown): FinanceTransaction | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    type: readFirstString(payload, ['type'], 'expense'),
    amount: readNumber(payload.amount),
    description: readFirstNullableString(payload, ['description']),
    category: readFirstNullableString(payload, ['category']),
    paymentMethod: readFirstNullableString(payload, ['payment_method']),
    referenceNumber: readFirstNullableString(payload, ['reference_number']),
    transactionDate: readFirstNullableString(payload, ['transaction_date']),
    contactId: readFirstNullableString(payload, ['contact_id']),
    financeGroupId: readFirstNullableString(payload, ['finance_group_id']),
    originalTransactionId: readFirstNullableString(payload, ['original_transaction_id']),
    reversalTransactionId: readFirstNullableString(payload, ['reversal_transaction_id']),
    isReversal: payload.is_reversal === true,
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseFinanceGroup(payload: unknown): FinanceGroup | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readFirstString(payload, ['name'], 'Unnamed group'),
    type: readFirstString(payload, ['type'], 'expense'),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseList<T>(payload: unknown, parser: (value: unknown) => T | null): T[] {
  return normalizeRows(payload)
    .map((item) => parser(item))
    .filter((item): item is T => Boolean(item));
}

function parseFirst<T>(payload: unknown, parser: (value: unknown) => T | null, errorText: string): T {
  const rows = parseList(payload, parser);
  if (rows.length === 0) {
    throw new Error(errorText);
  }
  return rows[0];
}

function normalizeTransactionRequest(input: TransactionRequest): TransactionRequest {
  const record = isRecord(input) ? input : {};
  const normalized: TransactionRequest = {};

  if ('type' in record) {
    const type = readString(record, 'type');
    if (type === 'income' || type === 'expense') {
      normalized.type = type;
    }
  }

  if ('amount' in record) {
    normalized.amount = readNumber(record.amount);
  }

  if ('transaction_date' in record) {
    normalized.transaction_date = readNullableString(record, 'transaction_date') ?? undefined;
  }

  if ('finance_group_id' in record) {
    normalized.finance_group_id = readNullableString(record, 'finance_group_id');
  }

  if ('description' in record) {
    normalized.description = readNullableString(record, 'description') ?? undefined;
  }

  if ('category' in record) {
    normalized.category = readNullableString(record, 'category');
  }

  if ('payment_method' in record) {
    normalized.payment_method = readNullableString(record, 'payment_method');
  }

  if ('reference_number' in record) {
    normalized.reference_number = readNullableString(record, 'reference_number');
  }

  if ('contact_id' in record) {
    normalized.contact_id = readNullableString(record, 'contact_id');
  }

  if ('attachments' in record && Array.isArray(record.attachments)) {
    normalized.attachments = record.attachments;
  }

  if ('original_transaction_id' in record) {
    normalized.original_transaction_id = readNullableString(record, 'original_transaction_id');
  }

  if ('reversal_transaction_id' in record) {
    normalized.reversal_transaction_id = readNullableString(record, 'reversal_transaction_id');
  }

  if ('is_reversal' in record && typeof record.is_reversal === 'boolean') {
    normalized.is_reversal = record.is_reversal;
  }

  return normalized;
}

function normalizeReverseRequest(input: ReverseTransactionRequest): ReverseTransactionRequest {
  const record = isRecord(input) ? input : {};
  return {
    reason: readString(record, 'reason'),
  };
}

function normalizeFinanceGroupRequest(
  input: CreateFinanceGroupRequest | UpdateFinanceGroupRequest,
): CreateFinanceGroupRequest | UpdateFinanceGroupRequest {
  const record = isRecord(input) ? input : {};
  const normalized: CreateFinanceGroupRequest | UpdateFinanceGroupRequest = {};

  if ('name' in record) {
    normalized.name = readString(record, 'name');
  }

  if ('type' in record) {
    const type = readString(record, 'type');
    if (type === 'income' || type === 'expense') {
      normalized.type = type;
    }
  }

  return normalized;
}

export async function listFinanceTransactions(token: string): Promise<FinanceTransaction[]> {
  const { data } = await apiClient.get<ListTransactionsResponseContract>('/transactions', { token });
  return parseList(data, parseFinanceTransaction);
}

export async function listFinanceGroups(token: string): Promise<FinanceGroup[]> {
  const { data } = await apiClient.get<ListFinanceGroupsResponseContract>('/finance-groups', { token });
  return parseList(data, parseFinanceGroup);
}

export async function createTransaction(
  token: string,
  input: CreateTransactionRequest,
): Promise<FinanceTransaction> {
  const { data } = await apiClient.post<CreateTransactionResponseContract, CreateTransactionRequestContract>(
    '/transactions',
    {
      token,
      body: normalizeTransactionRequest(input) as CreateTransactionRequestContract,
      idempotencyKey: `transactions-create-${Date.now()}`,
    },
  );
  return parseFirst(data, parseFinanceTransaction, 'Finance API returned an empty create payload.');
}

export async function updateTransaction(
  token: string,
  transactionId: string,
  input: UpdateTransactionRequest,
): Promise<FinanceTransaction> {
  const { data } = await apiClient.patch<UpdateTransactionResponseContract, UpdateTransactionRequestContract>(
    `/transactions/${transactionId}`,
    {
      token,
      body: normalizeTransactionRequest(input) as UpdateTransactionRequestContract,
    },
  );
  return parseFirst(data, parseFinanceTransaction, 'Finance API returned an empty update payload.');
}

export async function deleteTransaction(token: string, transactionId: string): Promise<void> {
  await apiClient.delete<operations['OrderWriteController_deleteTransaction_v1']['responses'][200]['content']['application/json']>(`/transactions/${transactionId}`, { token });
}

export async function reverseTransaction(
  token: string,
  transactionId: string,
  input: ReverseTransactionRequest,
): Promise<FinanceTransaction> {
  const { data } = await apiClient.post<ReverseTransactionResponseContract, ReverseTransactionRequestContract>(
    `/transactions/${transactionId}/commands/reverse`,
    {
      token,
      body: normalizeReverseRequest(input),
      idempotencyKey: `transactions-reverse-${Date.now()}`,
    },
  );
  return parseFirst(data, parseFinanceTransaction, 'Finance API returned an empty reverse payload.');
}

export async function createFinanceGroup(
  token: string,
  input: CreateFinanceGroupRequest,
): Promise<FinanceGroup> {
  const { data } = await apiClient.post<CreateFinanceGroupResponseContract, CreateFinanceGroupRequestContract>(
    '/finance-groups',
    {
      token,
      body: normalizeFinanceGroupRequest(input) as CreateFinanceGroupRequestContract,
      idempotencyKey: `finance-groups-create-${Date.now()}`,
    },
  );
  return parseFirst(data, parseFinanceGroup, 'Finance groups API returned an empty create payload.');
}

export async function updateFinanceGroup(
  token: string,
  financeGroupId: string,
  input: UpdateFinanceGroupRequest,
): Promise<FinanceGroup> {
  const { data } = await apiClient.patch<UpdateFinanceGroupResponseContract, UpdateFinanceGroupRequestContract>(
    `/finance-groups/${financeGroupId}`,
    {
      token,
      body: normalizeFinanceGroupRequest(input) as UpdateFinanceGroupRequestContract,
    },
  );
  return parseFirst(data, parseFinanceGroup, 'Finance groups API returned an empty update payload.');
}

export async function deleteFinanceGroup(token: string, financeGroupId: string): Promise<void> {
  await apiClient.delete<operations['OrderWriteController_deleteFinanceGroup_v1']['responses'][200]['content']['application/json']>(`/finance-groups/${financeGroupId}`, { token });
}
