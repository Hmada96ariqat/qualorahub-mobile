import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { FinanceGroup, FinanceTransaction } from '../../../api/modules/finance';
import {
  AppButton,
  AppDatePicker,
  AppInput,
  AppScreen,
  AppSelect,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  DotBadge,
  EmptyState,
  ErrorState,
  FormValidationProvider,
  FormField,
  HeaderIconButton,
  HeaderMenuButton,
  ListRow,
  PillTabs,
  ProfileCard,
  PullToRefreshContainer,
  QuickActionGrid,
  SearchBar,
  SectionHeader,
  Skeleton,
  StatStrip,
  SystemHeaderActions,
  useFormValidation,
  useToast,
} from '../../../components';
import type {
  DotBadgeVariant,
  InfoGridCell,
  ListRowIconVariant,
  QuickAction,
} from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { palette } from '../../../theme/tokens';
import {
  FINANCE_GROUP_TYPE_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  buildFinanceSummaryMetrics,
  filterFinanceGroupsByType,
  formatCurrency,
  isReversalLinkedTransaction,
  matchesTransactionListMode,
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

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return value.includes('T') ? value.slice(0, 10) : value;
}

function toTransactionTitle(row: FinanceTransaction): string {
  if (row.description?.trim()) return row.description.trim();
  if (row.isReversal) return 'Reversal transaction';
  return normalizeTransactionType(row.type) === 'income'
    ? 'Income transaction'
    : 'Expense transaction';
}

function toGroupLabel(
  groupId: string | null | undefined,
  groupsById: Map<string, FinanceGroup>,
): string {
  if (!groupId) return '—';
  return groupsById.get(groupId)?.name ?? '—';
}

function toTxTypeLabel(row: FinanceTransaction): string {
  if (row.isReversal) return 'Reversal';
  return normalizeTransactionType(row.type) === 'income' ? 'Income' : 'Expense';
}

function toTxDotBadgeVariant(row: FinanceTransaction): DotBadgeVariant {
  if (row.isReversal) return 'neutral';
  return normalizeTransactionType(row.type) === 'income' ? 'success' : 'warning';
}

function toTxIconVariant(row: FinanceTransaction): ListRowIconVariant {
  if (row.isReversal) return 'neutral';
  return normalizeTransactionType(row.type) === 'income' ? 'green' : 'amber';
}

function toTxIcon(row: FinanceTransaction): string {
  if (row.isReversal) return 'swap-horizontal';
  return normalizeTransactionType(row.type) === 'income' ? 'cash-plus' : 'cash-minus';
}

// ─── screen ──────────────────────────────────────────────────────────────────

export function FinanceScreen() {
  const { t } = useAppI18n();
  const { showToast } = useToast();
  const transactionFormScrollRef = useRef<ScrollView | null>(null);
  const transactionFormValidation = useFormValidation<
    'transactionName' | 'amount' | 'transactionDate' | 'financeGroupId'
  >(transactionFormScrollRef);
  const groupFormScrollRef = useRef<ScrollView | null>(null);
  const groupFormValidation = useFormValidation<'name'>(groupFormScrollRef);
  const reverseFormScrollRef = useRef<ScrollView | null>(null);
  const reverseFormValidation = useFormValidation<'reason'>(reverseFormScrollRef);
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

  // — detail sheets (replaces ActionSheets)
  const [detailTransaction, setDetailTransaction] = useState<FinanceTransaction | null>(null);
  const [detailGroup, setDetailGroup] = useState<FinanceGroup | null>(null);

  // — delete confirm targets
  const [deleteTransactionTarget, setDeleteTransactionTarget] =
    useState<FinanceTransaction | null>(null);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<FinanceGroup | null>(null);

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
    () => new Map(financeGroups.map((g) => [g.id, g])),
    [financeGroups],
  );

  const summary = useMemo(() => buildFinanceSummaryMetrics(transactions), [transactions]);

  const filteredTransactions = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return transactions.filter((row) => {
      if (!matchesTransactionListMode(row, listMode)) return false;
      if (!q) return true;
      return (row.description ?? '').trim().toLowerCase().includes(q);
    });
  }, [transactions, listMode, searchValue, groupsById]);

  const reversalCount = useMemo(
    () => transactions.filter((t) => matchesTransactionListMode(t, 'reversal')).length,
    [transactions],
  );
  const incomeCount = useMemo(
    () => transactions.filter((t) => matchesTransactionListMode(t, 'income')).length,
    [transactions],
  );
  const expenseCount = useMemo(
    () => transactions.filter((t) => matchesTransactionListMode(t, 'expense')).length,
    [transactions],
  );

  const pillTabs = useMemo(
    () => [
      { value: 'all', label: transactions.length > 0 ? `All (${transactions.length})` : 'All' },
      { value: 'income', label: incomeCount > 0 ? `Income (${incomeCount})` : 'Income' },
      { value: 'expense', label: expenseCount > 0 ? `Expense (${expenseCount})` : 'Expense' },
      {
        value: 'reversal',
        label: reversalCount > 0 ? `Reversals (${reversalCount})` : 'Reversals',
      },
    ],
    [transactions.length, incomeCount, expenseCount, reversalCount],
  );

  const transactionGroupOptions = useMemo(
    () =>
      filterFinanceGroupsByType(financeGroups, transactionFormValues.type).map((group) => ({
        label: `${group.name} (${group.type})`,
        value: group.id,
      })),
    [financeGroups, transactionFormValues.type],
  );

  useEffect(() => {
    if (!transactionFormVisible || !transactionFormValues.financeGroupId) return;

    const selectedGroup = groupsById.get(transactionFormValues.financeGroupId);
    if (!selectedGroup) return;

    if (normalizeFinanceGroupType(selectedGroup.type) !== transactionFormValues.type) {
      setTransactionFormValues((prev) =>
        prev.financeGroupId
          ? {
              ...prev,
              financeGroupId: '',
            }
          : prev,
      );
    }
  }, [
    groupsById,
    transactionFormValues.financeGroupId,
    transactionFormValues.type,
    transactionFormVisible,
  ]);

  // ─── transaction form ────────────────────────────────────────────────────

  function closeTransactionForm() {
    setTransactionFormVisible(false);
    setTransactionFormValues(toTransactionFormValues());
    setEditingTransaction(null);
    transactionFormValidation.reset();
  }

  function openCreateTransactionForm() {
    setTransactionFormMode('create');
    setEditingTransaction(null);
    setTransactionFormValues(toTransactionFormValues());
    setTransactionFormVisible(true);
  }

  function openEditTransactionForm(transaction: FinanceTransaction) {
    if (isReversalLinkedTransaction(transaction)) {
      showToast({
        message: 'Reversal-linked transactions are locked and cannot be edited.',
        variant: 'error',
      });
      return;
    }

    setDetailTransaction(null);
    setTransactionFormMode('edit');
    setEditingTransaction(transaction);
    setTransactionFormValues(toTransactionFormValues(transaction));
    setTransactionFormVisible(true);
  }

  async function submitTransactionForm() {
    const amount = parseAmountInput(transactionFormValues.amount);
    const valid = transactionFormValidation.validate([
      {
        field: 'transactionName',
        message: 'Transaction name is required.',
        isValid: transactionFormValues.transactionName.trim().length > 0,
      },
      {
        field: 'amount',
        message: 'Enter a valid amount greater than 0.',
        isValid: amount !== null && amount > 0,
      },
      {
        field: 'transactionDate',
        message: 'Transaction date is required.',
        isValid: Boolean(transactionFormValues.transactionDate),
      },
      {
        field: 'financeGroupId',
        message: 'Select a finance group before saving.',
        isValid: Boolean(transactionFormValues.financeGroupId),
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }
    if (amount === null) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const payload = {
      type: transactionFormValues.type,
      description: transactionFormValues.transactionName.trim(),
      amount,
      transaction_date: transactionFormValues.transactionDate,
      finance_group_id: transactionFormValues.financeGroupId,
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
    if (!deleteTransactionTarget || isMutating) return;
    if (isReversalLinkedTransaction(deleteTransactionTarget)) {
      showToast({
        message: 'Reversal-linked transactions are view only and cannot be deleted.',
        variant: 'error',
      });
      setDeleteTransactionTarget(null);
      return;
    }

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
    if (isReversalLinkedTransaction(transaction)) {
      showToast({
        message: 'This transaction has already been reversed and cannot be reversed again.',
        variant: 'error',
      });
      return;
    }

    setDetailTransaction(null);
    setReverseTarget(transaction);
    setReverseReason('');
    reverseFormValidation.reset();
    setReverseSheetVisible(true);
  }

  async function submitReverseTransaction() {
    if (!reverseTarget || isMutating) return;
    if (isReversalLinkedTransaction(reverseTarget)) {
      showToast({
        message: 'This transaction has already been reversed and cannot be reversed again.',
        variant: 'error',
      });
      setReverseSheetVisible(false);
      setReverseTarget(null);
      setReverseReason('');
      return;
    }

    const reason = reverseReason.trim();

    if (!reason) {
      reverseFormValidation.validate([
        {
          field: 'reason',
          message: 'Reverse reason is required.',
          isValid: false,
        },
      ]);
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    try {
      await reverseTransaction(reverseTarget.id, { reason });
      showToast({ message: 'Transaction reversed.', variant: 'success' });
      setListMode('reversal');
      setReverseSheetVisible(false);
      setReverseReason('');
      setReverseTarget(null);
      reverseFormValidation.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reverse transaction failed.';
      showToast({ message, variant: 'error' });
    }
  }

  // ─── group form ──────────────────────────────────────────────────────────

  function closeGroupForm() {
    setGroupFormVisible(false);
    setEditingGroup(null);
    setGroupFormValues(toFinanceGroupFormValues());
    groupFormValidation.reset();
  }

  function openCreateGroupForm() {
    setGroupFormMode('create');
    setEditingGroup(null);
    setGroupFormValues(toFinanceGroupFormValues());
    setGroupFormVisible(true);
  }

  function openEditGroupForm(group: FinanceGroup) {
    setDetailGroup(null);
    setGroupFormMode('edit');
    setEditingGroup(group);
    setGroupFormValues(toFinanceGroupFormValues(group));
    setGroupFormVisible(true);
  }

  async function submitGroupForm() {
    const trimmedName = groupFormValues.name.trim();
    const valid = groupFormValidation.validate([
      {
        field: 'name',
        message: 'Finance group name is required.',
        isValid: trimmedName.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
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

  // ─── quick actions ───────────────────────────────────────────────────────

  function buildTransactionQuickActions(tx: FinanceTransaction): QuickAction[] {
    const isLinked = isReversalLinkedTransaction(tx);
    if (isLinked) {
      return [];
    }

    return [
      {
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => openEditTransactionForm(tx),
      },
      {
        key: 'reverse',
        icon: 'swap-horizontal',
        label: 'Reverse',
        color: 'amber',
        onPress: () => openReverseTransaction(tx),
      },
      {
      key: 'delete',
      icon: 'delete-outline',
      label: 'Delete',
      color: 'red',
      onPress: () => {
        setDetailTransaction(null);
        setDeleteTransactionTarget(tx);
      },
      },
    ];
  }

  function buildGroupQuickActions(group: FinanceGroup): QuickAction[] {
    return [
      {
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => openEditGroupForm(group),
      },
      {
        key: 'delete',
        icon: 'delete-outline',
        label: 'Delete',
        color: 'red',
        onPress: () => {
          setDetailGroup(null);
          setDeleteGroupTarget(group);
        },
      },
    ];
  }

  // ─── detail cells ────────────────────────────────────────────────────────

  function buildTransactionCells(tx: FinanceTransaction): InfoGridCell[] {
    return [
      { label: 'Name', value: tx.description?.trim() || '—' },
      { label: 'Type', value: toTxTypeLabel(tx) },
      { label: 'Date', value: toDateLabel(tx.transactionDate) },
      { label: 'Group', value: toGroupLabel(tx.financeGroupId, groupsById) },
      { label: 'Category', value: tx.category ?? '—' },
      { label: 'Payment', value: tx.paymentMethod ?? '—' },
      { label: 'Reference', value: tx.referenceNumber ?? '—' },
    ];
  }

  // ─── render ──────────────────────────────────────────────────────────────

  const detailTransactionActions = detailTransaction
    ? buildTransactionQuickActions(detailTransaction)
    : [];

  return (
    <AppScreen padded={false}>
      {/* Sticky header */}
      <View style={styles.header}>
        <View style={styles.headerLead}>
          <HeaderMenuButton testID="finance-header-menu" />
          <Text style={styles.headerTitle}>{t('sidebar', 'items.finance', 'Finance')}</Text>
        </View>
        <SystemHeaderActions notificationTestID="finance-header-notifications">
          <HeaderIconButton
            icon="folder-outline"
            onPress={openCreateGroupForm}
            testID="finance-header-create-group"
          />
          <HeaderIconButton
            icon="plus"
            onPress={openCreateTransactionForm}
            filled
            testID="finance-header-create-transaction"
          />
        </SystemHeaderActions>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder="Search transaction name..."
          testID="finance-search"
        />
      </View>

      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Summary strip */}
          <StatStrip
            items={[
              { value: formatCurrency(summary.incomeTotal), label: 'Income', color: 'green' },
              { value: formatCurrency(summary.expenseTotal), label: 'Expense', color: 'amber' },
              {
                value: formatCurrency(summary.netTotal),
                label: 'Net',
                color: summary.netTotal >= 0 ? 'green' : 'red',
              },
            ]}
          />

          {/* Pill tabs */}
          <PillTabs
            value={listMode}
            tabs={pillTabs}
            onValueChange={(v) => setListMode(v as TransactionListMode)}
            testID="finance-tabs"
          />

          {/* Transactions */}
          <SectionHeader
            title="Transactions"
            trailing={
              filteredTransactions.length > 0
                ? `${filteredTransactions.length} shown`
                : undefined
            }
          />

          {isLoading ? (
            <>
              <Skeleton height={68} />
              <Skeleton height={68} />
              <Skeleton height={68} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title="No transactions found"
              message="Try another filter or create a new transaction."
              actionLabel="Create transaction"
              onAction={openCreateTransactionForm}
            />
          ) : (
            filteredTransactions.map((row) => (
              <ListRow
                key={row.id}
                icon={toTxIcon(row)}
                iconVariant={toTxIconVariant(row)}
                title={toTransactionTitle(row)}
                subtitle={`${formatCurrency(row.amount)} • ${toDateLabel(row.transactionDate)}`}
                badge={<DotBadge label={toTxTypeLabel(row)} variant={toTxDotBadgeVariant(row)} />}
                accentBorder={row.isReversal}
                onPress={() => setDetailTransaction(row)}
              />
            ))
          )}

          {/* Finance groups */}
          <View style={styles.groupsSection}>
            <SectionHeader
              title="Finance Groups"
              trailing={
                financeGroups.length > 0 ? `${financeGroups.length} total` : undefined
              }
            />
            {isLoading ? (
              <>
                <Skeleton height={56} />
                <Skeleton height={56} />
              </>
            ) : financeGroups.length === 0 ? (
              <EmptyState
                title="No finance groups"
                message="Create a group to start categorising transactions."
                actionLabel="Create group"
                onAction={openCreateGroupForm}
              />
            ) : (
              financeGroups.map((group) => (
                <ListRow
                  key={group.id}
                  icon="folder-outline"
                  iconVariant="neutral"
                  title={group.name}
                  subtitle={`${group.type} • Updated ${toDateLabel(group.updatedAt)}`}
                  onPress={() => setDetailGroup(group)}
                />
              ))
            )}
          </View>
        </ScrollView>
      </PullToRefreshContainer>

      {/* ─── Transaction detail sheet ─────────────────────────────────── */}
      <BottomSheet
        visible={Boolean(detailTransaction)}
        onDismiss={() => setDetailTransaction(null)}
        title={detailTransaction ? toTransactionTitle(detailTransaction) : 'Transaction'}
      >
        {detailTransaction ? (
          <>
            <ProfileCard
              icon={toTxIcon(detailTransaction)}
              name={toTransactionTitle(detailTransaction)}
              subtitle={`${formatCurrency(detailTransaction.amount)} • ${toDateLabel(detailTransaction.transactionDate)}`}
              cells={buildTransactionCells(detailTransaction)}
            />
            {detailTransactionActions.length > 0 ? (
              <QuickActionGrid actions={detailTransactionActions} />
            ) : (
              <Text style={styles.viewOnlyNote}>This transaction is view only.</Text>
            )}
          </>
        ) : null}
      </BottomSheet>

      {/* ─── Group detail sheet ─────────────────────────────────────────── */}
      <BottomSheet
        visible={Boolean(detailGroup)}
        onDismiss={() => setDetailGroup(null)}
        title={detailGroup?.name ?? 'Finance Group'}
      >
        {detailGroup ? (
          <>
            <ProfileCard
              icon="folder-outline"
              name={detailGroup.name}
              subtitle={`${detailGroup.type} group`}
              cells={[
                { label: 'Type', value: detailGroup.type },
                { label: 'Updated', value: toDateLabel(detailGroup.updatedAt) },
              ]}
            />
            <QuickActionGrid actions={buildGroupQuickActions(detailGroup)} />
          </>
        ) : null}
      </BottomSheet>

      {/* ─── Transaction form sheet ───────────────────────────────────────── */}
      <BottomSheet
        visible={transactionFormVisible}
        onDismiss={closeTransactionForm}
        scrollViewRef={transactionFormScrollRef}
        title={transactionFormMode === 'create' ? 'Create Transaction' : 'Edit Transaction'}
        testID="finance-transaction-sheet"
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeTransactionForm}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label={transactionFormMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitTransactionForm()}
                loading={isMutating}
                disabled={isMutating}
                testID="finance-transaction-submit"
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={transactionFormValidation.providerValue}>
          <FormField label="Type">
            <AppSelect
              value={transactionFormValues.type}
              onChange={(value) =>
                setTransactionFormValues((prev) => ({
                  ...prev,
                  type: normalizeTransactionType(value),
                }))
              }
              options={TRANSACTION_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              label="Transaction type"
              testID="finance-form-type-select"
            />
          </FormField>

          <FormField label="Transaction name" name="transactionName" required>
            <AppInput
              value={transactionFormValues.transactionName}
              onChangeText={(value) => {
                transactionFormValidation.clearFieldError('transactionName');
                setTransactionFormValues((prev) => ({ ...prev, transactionName: value }));
              }}
              placeholder="Enter transaction name"
              testID="finance-form-transaction-name"
            />
          </FormField>

          <FormField label="Amount" name="amount" required>
            <AppInput
              value={transactionFormValues.amount}
              onChangeText={(value) => {
                transactionFormValidation.clearFieldError('amount');
                setTransactionFormValues((prev) => ({ ...prev, amount: value }));
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              testID="finance-form-amount"
            />
          </FormField>

          <FormField label="Transaction date" name="transactionDate" required>
            <AppDatePicker
              value={transactionFormValues.transactionDate}
              onChange={(value) => {
                transactionFormValidation.clearFieldError('transactionDate');
                setTransactionFormValues((prev) => ({
                  ...prev,
                  transactionDate: value ?? '',
                }));
              }}
              label="Transaction date"
            />
          </FormField>

          <FormField label="Finance group" name="financeGroupId" required>
            <AppSelect
              value={transactionFormValues.financeGroupId}
              onChange={(value) => {
                transactionFormValidation.clearFieldError('financeGroupId');
                setTransactionFormValues((prev) => ({ ...prev, financeGroupId: value }));
              }}
              options={transactionGroupOptions}
              label="Finance group"
              placeholder="Select finance group"
              testID="finance-form-group-select"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ─── Group form sheet ─────────────────────────────────────────────── */}
      <BottomSheet
        visible={groupFormVisible}
        onDismiss={closeGroupForm}
        scrollViewRef={groupFormScrollRef}
        title={groupFormMode === 'create' ? 'Create Finance Group' : 'Edit Finance Group'}
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeGroupForm}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label={groupFormMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitGroupForm()}
                loading={isMutating}
                disabled={isMutating}
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={groupFormValidation.providerValue}>
          <FormField label="Name" name="name" required>
            <AppInput
              value={groupFormValues.name}
              onChangeText={(value) => {
                groupFormValidation.clearFieldError('name');
                setGroupFormValues((prev) => ({ ...prev, name: value }));
              }}
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
              options={FINANCE_GROUP_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              label="Group type"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ─── Reverse sheet ──────────────────────────────────────────────────────── */}
      <BottomSheet
        visible={reverseSheetVisible}
        onDismiss={() => {
          setReverseSheetVisible(false);
          setReverseTarget(null);
          setReverseReason('');
          reverseFormValidation.reset();
        }}
        scrollViewRef={reverseFormScrollRef}
        title="Reverse transaction"
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={() => {
                  setReverseSheetVisible(false);
                  setReverseTarget(null);
                  setReverseReason('');
                }}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label="Reverse"
                tone="destructive"
                onPress={() => void submitReverseTransaction()}
                loading={isMutating}
                disabled={isMutating}
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={reverseFormValidation.providerValue}>
          <FormField
            label="Reason"
            name="reason"
            required
            helperText="Required by backend reverse command endpoint."
          >
            <AppTextArea
              value={reverseReason}
              onChangeText={(value) => {
                reverseFormValidation.clearFieldError('reason');
                setReverseReason(value);
              }}
              placeholder="Reason for reversal"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ─── Confirm delete transaction ─────────────────────────────────────── */}
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
        confirmLoading={isMutating}
        confirmDisabled={isMutating}
      />

      {/* ─── Confirm delete group ───────────────────────────────────────────── */}
      <ConfirmDialog
        visible={Boolean(deleteGroupTarget)}
        title={
          deleteGroupTarget ? `Delete ${deleteGroupTarget.name}?` : 'Delete finance group?'
        }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: palette.background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.foreground,
  },
  headerLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: palette.background,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  groupsSection: {
    marginTop: 8,
  },
  viewOnlyNote: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.mutedForeground,
    marginBottom: 14,
  },
  formFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  formBtn: {
    flex: 1,
  },
});
