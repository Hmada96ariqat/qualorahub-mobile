# Code Map: `src/modules/finance/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type { FinanceGroup, FinanceTransaction } from '../../api/modules/finance';`

## Exports
- `export const TRANSACTION_TYPE_OPTIONS = [`
- `export const FINANCE_GROUP_TYPE_OPTIONS = [`
- `export type TransactionTypeOption = (typeof TRANSACTION_TYPE_OPTIONS)[number]['value'];`
- `export type FinanceGroupTypeOption = (typeof FINANCE_GROUP_TYPE_OPTIONS)[number]['value'];`
- `export type TransactionFormMode = 'create' | 'edit';`
- `export type FinanceGroupFormMode = 'create' | 'edit';`
- `export type TransactionListMode = 'all' | TransactionTypeOption | 'reversal';`
- `export type TransactionFormValues = {`
- `export type FinanceGroupFormValues = {`
- `export type FinanceSummaryMetrics = {`
- `export function parseAmountInput(value: string): number | null {`
- `export function formatCurrency(value: number): string {`
- `export function normalizeTransactionType(value: string | null | undefined): TransactionTypeOption {`
- `export function normalizeFinanceGroupType(value: string | null | undefined): FinanceGroupTypeOption {`
- `export function toTransactionFormValues(transaction?: FinanceTransaction | null): TransactionFormValues {`
- `export function toFinanceGroupFormValues(group?: FinanceGroup | null): FinanceGroupFormValues {`
- `export function buildFinanceSummaryMetrics(`
