# Code Map: `src/modules/orders/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type {`

## Exports
- `export type Phase10Tab = 'orders' | 'stock' | 'sales';`
- `export type CreateOrderStatus = NonNullable<CreateOrderRequest['status']>;`
- `export type UpdatableOrderStatus = UpdateOrderStatusRequest['status'];`
- `export type StockVoucherTypeInput = CreateStockVoucherRequest['type'];`
- `export type StockVoucherStatusInput = NonNullable<UpdateStockVoucherStatusRequest['status']>;`
- `export type SalesStatusInput = NonNullable<CreateSalesTransactionRequest['status']>;`
- `export type SalesPriceTypeInput = NonNullable<CreateSalesTransactionRequest['price_type']>;`
- `export const PHASE10_TAB_OPTIONS = [`
- `export const ORDER_STATUS_OPTIONS = [`
- `export const STOCK_VOUCHER_TYPE_OPTIONS = [`
- `export const STOCK_VOUCHER_STATUS_OPTIONS = [`
- `export const SALES_STATUS_OPTIONS = [`
- `export const SALES_PRICE_TYPE_OPTIONS = [`
- `export type OrderFormValues = {`
- `export type OrderStatusFormValues = {`
- `export type StockVoucherFormValues = {`
- `export type StockVoucherLineItemFormValues = {`
- `export type SalesTransactionFormValues = {`
- `export type SalesTransactionLineFormValues = {`
- `export function parseOptionalNumber(value: string): number | undefined {`
- `export function normalizeCreateOrderStatus(value: string | null | undefined): CreateOrderStatus {`
- `export function normalizeOrderStatus(value: string | null | undefined): UpdatableOrderStatus {`
- `export function normalizeStockVoucherType(value: string | null | undefined): StockVoucherTypeInput {`
- `export function normalizeStockVoucherStatus(value: string | null | undefined): StockVoucherStatusInput {`
- `export function normalizeSalesStatus(value: string | null | undefined): SalesStatusInput {`
- `export function normalizeSalesPriceType(value: string | null | undefined): SalesPriceTypeInput {`
- `export function toOrderFormValues(order?: OrderSummary | null): OrderFormValues {`
- `export function toOrderStatusFormValues(order?: OrderSummary | null): OrderStatusFormValues {`
- `export function toStockVoucherFormValues(voucher?: StockVoucher | null): StockVoucherFormValues {`
- `export function toStockVoucherLineItemFormValues(): StockVoucherLineItemFormValues {`
- `export function toSalesTransactionFormValues(`
- `export function toSalesTransactionLineFormValues(): SalesTransactionLineFormValues {`
