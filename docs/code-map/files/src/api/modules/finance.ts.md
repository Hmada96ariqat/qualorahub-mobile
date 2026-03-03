# Code Map: `src/api/modules/finance.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import {`

## Exports
- `export type CreateTransactionRequest = CreateTransactionRequestContract;`
- `export type UpdateTransactionRequest = UpdateTransactionRequestContract;`
- `export type ReverseTransactionRequest = ReverseTransactionRequestContract;`
- `export type CreateFinanceGroupRequest = CreateFinanceGroupRequestContract;`
- `export type UpdateFinanceGroupRequest = UpdateFinanceGroupRequestContract;`
- `export type FinanceTransactionType = 'income' | 'expense' | string;`
- `export type FinanceTransaction = {`
- `export type FinanceGroupType = 'income' | 'expense' | string;`
- `export type FinanceGroup = {`
- `export async function listFinanceTransactions(token: string): Promise<FinanceTransaction[]> {`
- `export async function listFinanceGroups(token: string): Promise<FinanceGroup[]> {`
- `export async function createTransaction(`
- `export async function updateTransaction(`
- `export async function deleteTransaction(token: string, transactionId: string): Promise<void> {`
- `export async function reverseTransaction(`
- `export async function createFinanceGroup(`
- `export async function updateFinanceGroup(`
- `export async function deleteFinanceGroup(token: string, financeGroupId: string): Promise<void> {`
