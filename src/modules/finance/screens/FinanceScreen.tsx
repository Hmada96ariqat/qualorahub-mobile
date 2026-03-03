import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { FinanceGroup, FinanceTransaction } from '../../../api/modules/finance';
import {
  ActionSheet,
  AppBadge,
  AppButton,
  AppCard,
  AppDatePicker,
  AppHeader,
  AppInput,
  AppListItem,
  AppScreen,
  AppSection,
  AppSelect,
  AppTabs,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  FormField,
  PaginationFooter,
  PullToRefreshContainer,
  Skeleton,
  useToast,
} from '../../../components';
import { palette, spacing, typography } from '../../../theme/tokens';
import {
  FINANCE_GROUP_TYPE_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  buildFinanceSummaryMetrics,
  formatCurrency,
  normalizeFinanceGroupType,
  normalizeTransactionType,
  parseAmountInput,
  toFinanceGroupFormValues,
  toTransactionFormValues,
  type FinanceGroupFormMode,
  type FinanceGroupFormValues,
  type TransactionFormMode,
  type TransactionFormValues,
  type TransactionListMode,
} from '../contracts';
import { useFinanceModule } from '../useFinanceModule.hook';

function toDateLabel(value: string | null | undefined): string {
  if (!value) return 'No date';
  return value.includes('T') ? value.slice(0, 10) : value;
}

function toTypeLabel(value: string): string {
  const normalized = normalizeTransactionType(value);
  return normalized === 'income' ? 'Income' : 'Expense';
}

function toTransactionTitle(row: FinanceTransaction): string {
  if (row.description && row.description.trim().length > 0) {
    return row.description;
  }

  if (row.isReversal) {
    return 'Reversal transaction';
  }

  return `${toTypeLabel(row.type)} transaction`;
}

function toTransactionMeta(row: FinanceTransaction): string {
  return `${formatCurrency(row.amount)} • ${toDateLabel(row.transactionDate)}`;
}

function toTransactionBadgeVariant(row: FinanceTransaction): 'warning' | 'success' {
  return normalizeTransactionType(row.type) === 'income' ? 'success' : 'warning';
}

function toGroupLabel(groupId: string | null, groupsById: Map<string, FinanceGroup>): string {
  if (!groupId) return 'No group';
  const group = groupsById.get(groupId);
  return group ? group.name : 'Unknown group';
}

export function FinanceScreen() {
  const { showToast } = useToast();
  const [listMode, setListMode] = useState<TransactionListMode>('all');
  const [searchValue, setSearchValue] = useState('');

  const [transactionFormVisible, setTransactionFormVisible] = useState(false);
  const [transactionFormMode, setTransactionFormMode] = useState<TransactionFormMode>('create');
  const [transactionFormValues, setTransactionFormValues] = useState<TransactionFormValues>(
    toTransactionFormValues(),
  );
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);

  const [groupFormVisible, setGroupFormVisible] = useState(false);
  const [groupFormMode, setGroupFormMode] = useState<FinanceGroupFormMode>('create');
  const [groupFormValues, setGroupFormValues] = useState<FinanceGroupFormValues>(
    toFinanceGroupFormValues(),
  );
  const [editingGroup, setEditingGroup] = useState<FinanceGroup | null>(null);

  const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | null>(null);
  const [deleteTransactionTarget, setDeleteTransactionTarget] = useState<FinanceTransaction | null>(null);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<FinanceGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<FinanceGroup | null>(null);

  const [reverseSheetVisible, setReverseSheetVisible] = useState(false);
  const [reverseReason, setReverseReason] = useState('');
  const [reverseTarget, setReverseTarget] = useState<FinanceTransaction | null>(null);

  const {
    transactions,
    financeGroups,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    reverseTransaction,
    createFinanceGroup,
    updateFinanceGroup,
    deleteFinanceGroup,
  } = useFinanceModule();

  const groupsById = useMemo(
    () => new Map(financeGroups.map((group) => [group.id, group])),
    [financeGroups],
  );

  const summary = useMemo(() => buildFinanceSummaryMetrics(transactions), [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return transactions.filter((row) => {
      if (listMode === 'income' || listMode === 'expense') {
        if (normalizeTransactionType(row.type) !== listMode) {
          return false;
        }
      }

      if (listMode === 'reversal' && !row.isReversal) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        row.description,
        row.category,
        row.referenceNumber,
        row.paymentMethod,
        toGroupLabel(row.financeGroupId, groupsById),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [groupsById, listMode, searchValue, transactions]);

  const groupOptions = useMemo(
    () =>
      financeGroups.map((group) => ({
        label: `${group.name} (${group.type})`,
        value: group.id,
      })),
    [financeGroups],
  );

  function closeTransactionForm() {
    setTransactionFormVisible(false);
    setTransactionFormValues(toTransactionFormValues());
    setEditingTransaction(null);
  }

  function openCreateTransactionForm() {
    setTransactionFormMode('create');
    setEditingTransaction(null);
    setTransactionFormValues(toTransactionFormValues());
    setTransactionFormVisible(true);
  }

  function openEditTransactionForm(transaction: FinanceTransaction) {
    setTransactionFormMode('edit');
    setEditingTransaction(transaction);
    setTransactionFormValues(toTransactionFormValues(transaction));
    setTransactionFormVisible(true);
  }

  async function submitTransactionForm() {
    const amount = parseAmountInput(transactionFormValues.amount);
    if (amount === null || amount <= 0) {
      showToast({ message: 'Enter a valid amount greater than 0.', variant: 'error' });
      return;
    }

    if (!transactionFormValues.transactionDate) {
      showToast({ message: 'Transaction date is required.', variant: 'error' });
      return;
    }

    if (!transactionFormValues.financeGroupId) {
      showToast({ message: 'Select a finance group before saving.', variant: 'error' });
      return;
    }

    const payload = {
      type: transactionFormValues.type,
      amount,
      transaction_date: transactionFormValues.transactionDate,
      finance_group_id: transactionFormValues.financeGroupId,
      description: transactionFormValues.description.trim() || undefined,
      category: transactionFormValues.category.trim() || null,
      payment_method: transactionFormValues.paymentMethod.trim() || null,
      reference_number: transactionFormValues.referenceNumber.trim() || null,
      contact_id: transactionFormValues.contactId.trim() || null,
    };

    try {
      if (transactionFormMode === 'create') {
        await createTransaction(payload);
        showToast({ message: 'Transaction created.', variant: 'success' });
      } else if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
        showToast({ message: 'Transaction updated.', variant: 'success' });
      }
      closeTransactionForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transaction mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitDeleteTransaction() {
    if (!deleteTransactionTarget) return;

    try {
      await deleteTransaction(deleteTransactionTarget.id);
      showToast({ message: 'Transaction deleted.', variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transaction deletion failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setDeleteTransactionTarget(null);
    }
  }

  function openReverseTransaction(transaction: FinanceTransaction) {
    setReverseTarget(transaction);
    setReverseReason('');
    setReverseSheetVisible(true);
  }

  async function submitReverseTransaction() {
    if (!reverseTarget) return;
    const reason = reverseReason.trim();

    if (!reason) {
      showToast({ message: 'Reverse reason is required.', variant: 'error' });
      return;
    }

    try {
      await reverseTransaction(reverseTarget.id, { reason });
      showToast({ message: 'Transaction reversed.', variant: 'success' });
      setReverseSheetVisible(false);
      setReverseReason('');
      setReverseTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reverse transaction failed.';
      showToast({ message, variant: 'error' });
    }
  }

  function closeGroupForm() {
    setGroupFormVisible(false);
    setEditingGroup(null);
    setGroupFormValues(toFinanceGroupFormValues());
  }

  function openCreateGroupForm() {
    setGroupFormMode('create');
    setEditingGroup(null);
    setGroupFormValues(toFinanceGroupFormValues());
    setGroupFormVisible(true);
  }

  function openEditGroupForm(group: FinanceGroup) {
    setGroupFormMode('edit');
    setEditingGroup(group);
    setGroupFormValues(toFinanceGroupFormValues(group));
    setGroupFormVisible(true);
  }

  async function submitGroupForm() {
    const trimmedName = groupFormValues.name.trim();
    if (!trimmedName) {
      showToast({ message: 'Finance group name is required.', variant: 'error' });
      return;
    }

    const payload = {
      name: trimmedName,
      type: groupFormValues.type,
    };

    try {
      if (groupFormMode === 'create') {
        await createFinanceGroup(payload);
        showToast({ message: 'Finance group created.', variant: 'success' });
      } else if (editingGroup) {
        await updateFinanceGroup(editingGroup.id, payload);
        showToast({ message: 'Finance group updated.', variant: 'success' });
      }
      closeGroupForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Finance group mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitDeleteGroup() {
    if (!deleteGroupTarget) return;

    try {
      await deleteFinanceGroup(deleteGroupTarget.id);
      showToast({ message: 'Finance group deleted.', variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Finance group deletion failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setDeleteGroupTarget(null);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="Finance"
        subtitle="Track transactions and finance groups with reusable list/form workflows."
      />

      <View style={styles.topActions}>
        <View style={styles.primaryAction}>
          <AppButton label="Create Transaction" onPress={openCreateTransactionForm} />
        </View>
        <View style={styles.secondaryAction}>
          <AppButton label="Create Group" mode="outlined" tone="neutral" onPress={openCreateGroupForm} />
        </View>
        <View style={styles.secondaryAction}>
          <AppButton
            label="Refresh"
            mode="outlined"
            tone="neutral"
            onPress={() => void refresh()}
            loading={isRefreshing || isMutating}
          />
        </View>
      </View>

      <AppCard>
        <AppSection
          title="Summary"
          description="Safe numeric formatting with income, expense, and net totals."
        >
          <View style={styles.summaryGrid}>
            <AppCard>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.incomeTotal)}</Text>
            </AppCard>
            <AppCard>
              <Text style={styles.summaryLabel}>Expense</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.expenseTotal)}</Text>
            </AppCard>
            <AppCard>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.netTotal)}</Text>
            </AppCard>
            <AppCard>
              <Text style={styles.summaryLabel}>Transactions</Text>
              <Text style={styles.summaryValue}>{summary.transactionCount}</Text>
              <Text style={styles.summaryHint}>{summary.reversalCount} reversals</Text>
            </AppCard>
          </View>
        </AppSection>
      </AppCard>

      <AppCard>
        <AppSection
          title="Transactions"
          description="Uses /transactions for list and supports create/update/delete/reverse command flows."
        >
          <FilterBar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search transactions"
          >
            <AppTabs
              value={listMode}
              onValueChange={(nextValue) => setListMode(nextValue as TransactionListMode)}
              tabs={[
                { value: 'all', label: 'All' },
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
                { value: 'reversal', label: 'Reversal' },
              ]}
            />
          </FilterBar>

          {isLoading ? (
            <>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title="No transactions found"
              message="Try another filter or create a transaction."
              actionLabel="Create transaction"
              onAction={openCreateTransactionForm}
            />
          ) : (
            <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
              <View style={styles.rows}>
                {filteredTransactions.map((row) => (
                  <AppCard key={row.id}>
                    <AppListItem
                      title={toTransactionTitle(row)}
                      description={toTransactionMeta(row)}
                      leftIcon={normalizeTransactionType(row.type) === 'income' ? 'cash-plus' : 'cash-minus'}
                      onPress={() => setSelectedTransaction(row)}
                    />
                    <View style={styles.rowMeta}>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaLabel}>Type</Text>
                        <AppBadge value={toTypeLabel(row.type)} variant={toTransactionBadgeVariant(row)} />
                      </View>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaLabel}>Group</Text>
                        <AppBadge value={toGroupLabel(row.financeGroupId, groupsById)} variant="neutral" />
                      </View>
                      {row.isReversal ? (
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaLabel}>Flag</Text>
                          <AppBadge value="Reversal" variant="accent" />
                        </View>
                      ) : null}
                    </View>
                  </AppCard>
                ))}
              </View>
            </PullToRefreshContainer>
          )}
        </AppSection>
      </AppCard>

      <AppCard>
        <AppSection
          title="Finance groups"
          description="Reusable finance group catalog for transaction assignment."
        >
          {isLoading ? (
            <>
              <Skeleton height={48} />
              <Skeleton height={48} />
            </>
          ) : financeGroups.length === 0 ? (
            <EmptyState
              title="No finance groups"
              message="Create a finance group to start categorizing transactions."
              actionLabel="Create group"
              onAction={openCreateGroupForm}
            />
          ) : (
            <View style={styles.rows}>
              {financeGroups.map((group) => (
                <AppCard key={group.id}>
                  <AppListItem
                    title={group.name}
                    description={`Type ${group.type} • Updated ${toDateLabel(group.updatedAt)}`}
                    leftIcon="folder-outline"
                    onPress={() => setSelectedGroup(group)}
                  />
                </AppCard>
              ))}
            </View>
          )}
        </AppSection>
      </AppCard>

      <PaginationFooter
        page={1}
        pageSize={Math.max(filteredTransactions.length, 1)}
        totalItems={filteredTransactions.length}
        onPageChange={() => undefined}
      />

      <BottomSheet
        visible={transactionFormVisible}
        onDismiss={closeTransactionForm}
        title={transactionFormMode === 'create' ? 'Create Transaction' : 'Edit Transaction'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeTransactionForm} />
            <AppButton
              label={transactionFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitTransactionForm()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormField label="Type">
          <AppSelect
            value={transactionFormValues.type}
            onChange={(value) =>
              setTransactionFormValues((prev) => ({
                ...prev,
                type: normalizeTransactionType(value),
              }))
            }
            options={TRANSACTION_TYPE_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            label="Transaction type"
          />
        </FormField>

        <FormField label="Amount" required>
          <AppInput
            value={transactionFormValues.amount}
            onChangeText={(value) => setTransactionFormValues((prev) => ({ ...prev, amount: value }))}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Transaction date" required>
          <AppDatePicker
            value={transactionFormValues.transactionDate}
            onChange={(value) =>
              setTransactionFormValues((prev) => ({
                ...prev,
                transactionDate: value ?? '',
              }))
            }
            label="Transaction date"
          />
        </FormField>

        <FormField label="Finance group" required>
          <AppSelect
            value={transactionFormValues.financeGroupId}
            onChange={(value) =>
              setTransactionFormValues((prev) => ({
                ...prev,
                financeGroupId: value,
              }))
            }
            options={groupOptions}
            label="Finance group"
            placeholder="Select finance group"
          />
        </FormField>

        <FormField label="Description">
          <AppTextArea
            value={transactionFormValues.description}
            onChangeText={(value) =>
              setTransactionFormValues((prev) => ({
                ...prev,
                description: value,
              }))
            }
            placeholder="Transaction description"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={groupFormVisible}
        onDismiss={closeGroupForm}
        title={groupFormMode === 'create' ? 'Create Finance Group' : 'Edit Finance Group'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeGroupForm} />
            <AppButton
              label={groupFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitGroupForm()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormField label="Name" required>
          <AppInput
            value={groupFormValues.name}
            onChangeText={(value) => setGroupFormValues((prev) => ({ ...prev, name: value }))}
            placeholder="Group name"
          />
        </FormField>

        <FormField label="Type">
          <AppSelect
            value={groupFormValues.type}
            onChange={(value) =>
              setGroupFormValues((prev) => ({
                ...prev,
                type: normalizeFinanceGroupType(value),
              }))
            }
            options={FINANCE_GROUP_TYPE_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            label="Group type"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={reverseSheetVisible}
        onDismiss={() => {
          setReverseSheetVisible(false);
          setReverseTarget(null);
          setReverseReason('');
        }}
        title="Reverse transaction"
        footer={
          <View style={styles.sheetFooter}>
            <AppButton
              label="Cancel"
              mode="text"
              tone="neutral"
              onPress={() => {
                setReverseSheetVisible(false);
                setReverseTarget(null);
                setReverseReason('');
              }}
            />
            <AppButton
              label="Reverse"
              tone="destructive"
              onPress={() => void submitReverseTransaction()}
              loading={isMutating}
              disabled={isMutating || !reverseReason.trim()}
            />
          </View>
        }
      >
        <FormField
          label="Reason"
          required
          helperText="Required by backend reverse command endpoint."
        >
          <AppTextArea
            value={reverseReason}
            onChangeText={setReverseReason}
            placeholder="Reason for reversal"
          />
        </FormField>
      </BottomSheet>

      <ActionSheet
        visible={Boolean(selectedTransaction)}
        title={selectedTransaction ? toTransactionTitle(selectedTransaction) : 'Transaction actions'}
        message="Choose an action for this transaction."
        onDismiss={() => setSelectedTransaction(null)}
        actions={
          selectedTransaction
            ? [
                {
                  key: 'edit',
                  label: 'Edit transaction',
                  onPress: () => openEditTransactionForm(selectedTransaction),
                },
                {
                  key: 'reverse',
                  label: 'Reverse transaction',
                  onPress: () => openReverseTransaction(selectedTransaction),
                },
                {
                  key: 'delete',
                  label: 'Delete transaction',
                  destructive: true,
                  onPress: () => setDeleteTransactionTarget(selectedTransaction),
                },
              ]
            : []
        }
      />

      <ActionSheet
        visible={Boolean(selectedGroup)}
        title={selectedGroup?.name ?? 'Finance group actions'}
        message="Choose an action for this finance group."
        onDismiss={() => setSelectedGroup(null)}
        actions={
          selectedGroup
            ? [
                {
                  key: 'edit',
                  label: 'Edit group',
                  onPress: () => openEditGroupForm(selectedGroup),
                },
                {
                  key: 'delete',
                  label: 'Delete group',
                  destructive: true,
                  onPress: () => setDeleteGroupTarget(selectedGroup),
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(deleteTransactionTarget)}
        title={
          deleteTransactionTarget
            ? `Delete ${toTransactionTitle(deleteTransactionTarget)}?`
            : 'Delete transaction?'
        }
        message="This action cannot be undone."
        onConfirm={() => void submitDeleteTransaction()}
        onCancel={() => setDeleteTransactionTarget(null)}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmTone="destructive"
      />

      <ConfirmDialog
        visible={Boolean(deleteGroupTarget)}
        title={deleteGroupTarget ? `Delete ${deleteGroupTarget.name}?` : 'Delete finance group?'}
        message="This action cannot be undone and may affect transaction assignments."
        onConfirm={() => void submitDeleteGroup()}
        onCancel={() => setDeleteGroupTarget(null)}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmTone="destructive"
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  summaryValue: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  summaryHint: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  rows: {
    gap: spacing.sm,
  },
  rowMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
