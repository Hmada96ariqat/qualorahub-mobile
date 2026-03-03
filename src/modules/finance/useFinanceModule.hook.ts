import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  type CreateFinanceGroupRequest,
  type CreateTransactionRequest,
  type ReverseTransactionRequest,
  type UpdateFinanceGroupRequest,
  type UpdateTransactionRequest,
} from '../../api/modules/finance';
import { useAuthSession } from '../../hooks/useAuthSession';

const FINANCE_TRANSACTIONS_QUERY_KEY = ['finance', 'transactions'] as const;
const FINANCE_GROUPS_QUERY_KEY = ['finance', 'groups'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useFinanceModule() {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: FINANCE_TRANSACTIONS_QUERY_KEY,
    queryFn: () => listFinanceTransactions(token ?? ''),
    enabled: Boolean(token),
  });

  const groupsQuery = useQuery({
    queryKey: FINANCE_GROUPS_QUERY_KEY,
    queryFn: () => listFinanceGroups(token ?? ''),
    enabled: Boolean(token),
  });

  const createTransactionMutation = useMutation({
    mutationFn: (input: CreateTransactionRequest) => createTransaction(token ?? '', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_TRANSACTIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'snapshot'] }),
      ]);
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: (payload: { transactionId: string; input: UpdateTransactionRequest }) =>
      updateTransaction(token ?? '', payload.transactionId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_TRANSACTIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'snapshot'] }),
      ]);
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (transactionId: string) => deleteTransaction(token ?? '', transactionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_TRANSACTIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'snapshot'] }),
      ]);
    },
  });

  const reverseTransactionMutation = useMutation({
    mutationFn: (payload: { transactionId: string; input: ReverseTransactionRequest }) =>
      reverseTransaction(token ?? '', payload.transactionId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_TRANSACTIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'snapshot'] }),
      ]);
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (input: CreateFinanceGroupRequest) => createFinanceGroup(token ?? '', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_GROUPS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: FINANCE_TRANSACTIONS_QUERY_KEY }),
      ]);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: (payload: { financeGroupId: string; input: UpdateFinanceGroupRequest }) =>
      updateFinanceGroup(token ?? '', payload.financeGroupId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_GROUPS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: FINANCE_TRANSACTIONS_QUERY_KEY }),
      ]);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (financeGroupId: string) => deleteFinanceGroup(token ?? '', financeGroupId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FINANCE_GROUPS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: FINANCE_TRANSACTIONS_QUERY_KEY }),
      ]);
    },
  });

  const isMutating =
    createTransactionMutation.isPending ||
    updateTransactionMutation.isPending ||
    deleteTransactionMutation.isPending ||
    reverseTransactionMutation.isPending ||
    createGroupMutation.isPending ||
    updateGroupMutation.isPending ||
    deleteGroupMutation.isPending;

  return {
    transactions: useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]),
    financeGroups: useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]),
    isLoading: transactionsQuery.isLoading || groupsQuery.isLoading,
    isRefreshing: transactionsQuery.isFetching || groupsQuery.isFetching,
    isMutating,
    errorMessage: transactionsQuery.error
      ? toErrorMessage(transactionsQuery.error, 'Failed to load transactions.')
      : groupsQuery.error
        ? toErrorMessage(groupsQuery.error, 'Failed to load finance groups.')
        : null,
    refresh: async () => {
      await Promise.all([transactionsQuery.refetch(), groupsQuery.refetch()]);
    },
    createTransaction: (input: CreateTransactionRequest) => createTransactionMutation.mutateAsync(input),
    updateTransaction: (transactionId: string, input: UpdateTransactionRequest) =>
      updateTransactionMutation.mutateAsync({ transactionId, input }),
    deleteTransaction: (transactionId: string) => deleteTransactionMutation.mutateAsync(transactionId),
    reverseTransaction: (transactionId: string, input: ReverseTransactionRequest) =>
      reverseTransactionMutation.mutateAsync({ transactionId, input }),
    createFinanceGroup: (input: CreateFinanceGroupRequest) => createGroupMutation.mutateAsync(input),
    updateFinanceGroup: (financeGroupId: string, input: UpdateFinanceGroupRequest) =>
      updateGroupMutation.mutateAsync({ financeGroupId, input }),
    deleteFinanceGroup: (financeGroupId: string) => deleteGroupMutation.mutateAsync(financeGroupId),
  };
}
