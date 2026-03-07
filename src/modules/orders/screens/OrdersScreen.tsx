import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type {
  OrderItem,
  OrderSummary,
  SalesTransaction,
  SalesTransactionLine,
  StockVoucher,
} from '../../../api/modules/orders';
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
  type DotBadgeVariant,
  type InfoGridCell,
  type QuickAction,
} from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { palette } from '../../../theme/tokens';
import {
  normalizeCreateOrderStatus,
  normalizeOrderStatus,
  normalizeSalesPriceType,
  normalizeSalesStatus,
  normalizeStockVoucherStatus,
  normalizeStockVoucherType,
  ORDER_STATUS_OPTIONS,
  parseOptionalNumber,
  SALES_PRICE_TYPE_OPTIONS,
  SALES_STATUS_OPTIONS,
  STOCK_VOUCHER_STATUS_OPTIONS,
  STOCK_VOUCHER_TYPE_OPTIONS,
  toOrderFormValues,
  toOrderStatusFormValues,
  toSalesTransactionFormValues,
  toSalesTransactionLineFormValues,
  toStockVoucherFormValues,
  toStockVoucherLineItemFormValues,
  type OrderFormValues,
  type OrderStatusFormValues,
  type Phase10Tab,
  type SalesTransactionFormValues,
  type SalesTransactionLineFormValues,
  type StockVoucherFormValues,
  type StockVoucherLineItemFormValues,
} from '../contracts';
import { useOrdersModule } from '../useOrdersModule.hook';

type FormMode = 'create' | 'edit';

type DetailTarget =
  | { type: 'order'; item: OrderSummary }
  | { type: 'voucher'; item: StockVoucher }
  | { type: 'sales'; item: SalesTransaction }
  | { type: 'sales-line'; item: SalesTransactionLine };

type ConfirmTarget =
  | { type: 'order-delete'; item: OrderSummary }
  | { type: 'voucher-delete'; item: StockVoucher }
  | { type: 'voucher-delete-lines'; item: StockVoucher }
  | { type: 'sales-complete'; item: SalesTransaction }
  | { type: 'sales-line-delete'; item: SalesTransactionLine };

type OrderFormField = 'productId' | 'quantity' | 'unitPrice';
type VoucherLineFormField = 'productId' | 'warehouseId' | 'quantity';
type SalesLineFormField = 'productId' | 'warehouseId' | 'quantity' | 'unitPrice';

function statusDotBadgeVariant(status: string): DotBadgeVariant {
  const n = status.trim().toLowerCase();
  if (n === 'delivered' || n === 'confirmed' || n === 'completed' || n === 'posted') return 'success';
  if (n === 'cancelled') return 'destructive';
  if (n === 'pending' || n === 'draft') return 'warning';
  return 'neutral';
}

function toEntityLabel(tab: Phase10Tab): string {
  if (tab === 'orders') return 'Order';
  if (tab === 'stock') return 'Stock Voucher';
  return 'Sales Transaction';
}

function money(value: number | null | undefined): string {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return safe.toFixed(2);
}

function toYesNo(value: string): 'yes' | 'no' {
  return value === 'yes' ? 'yes' : 'no';
}

function toInventoryItems(items: OrderItem[]) {
  return items
    .filter((item) => Boolean(item.productId))
    .map((item) => ({
      product_id: item.productId as string,
      product_name: item.productName,
      quantity: item.quantity,
    }));
}

export function OrdersScreen() {
  const { t } = useAppI18n();
  const { showToast } = useToast();
  const {
    farmContext,
    unreadOrderCount,
    unreadOrders,
    stockVouchers,
    stockProducts,
    stockContacts,
    stockWarehouses,
    productInventory,
    salesTransactions,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    createOrder,
    confirmOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    markOrderAsRead,
    createStockOutForOrder,
    validateOrderInventory,
    allocateOrderInventory,
    createStockVoucher,
    updateStockVoucher,
    updateStockVoucherStatus,
    deleteStockVoucher,
    insertStockVoucherLineItems,
    deleteStockVoucherLineItems,
    createSalesTransaction,
    updateSalesTransaction,
    completeSalesTransaction,
    createSalesTransactionLine,
    updateSalesTransactionLine,
    deleteSalesTransactionLine,
    loadOrderDetails,
    loadSalesTransaction,
    loadSalesTransactionLines,
  } = useOrdersModule();

  const [activeTab, setActiveTab] = useState<Phase10Tab>('orders');
  const [searchValue, setSearchValue] = useState('');
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  const [orderFormVisible, setOrderFormVisible] = useState(false);
  const [orderFormMode, setOrderFormMode] = useState<FormMode>('create');
  const [editingOrder, setEditingOrder] = useState<OrderSummary | null>(null);
  const [orderFormValues, setOrderFormValues] = useState<OrderFormValues>(toOrderFormValues());

  const [orderStatusVisible, setOrderStatusVisible] = useState(false);
  const [orderStatusTarget, setOrderStatusTarget] = useState<OrderSummary | null>(null);
  const [orderStatusValues, setOrderStatusValues] = useState<OrderStatusFormValues>(
    toOrderStatusFormValues(),
  );

  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null);
  const [orderDetailsOrder, setOrderDetailsOrder] = useState<OrderSummary | null>(null);
  const [orderDetailsItems, setOrderDetailsItems] = useState<OrderItem[]>([]);
  const [orderDetailsStockOut, setOrderDetailsStockOut] = useState(false);

  const [voucherFormVisible, setVoucherFormVisible] = useState(false);
  const [voucherFormMode, setVoucherFormMode] = useState<FormMode>('create');
  const [editingVoucher, setEditingVoucher] = useState<StockVoucher | null>(null);
  const [voucherFormValues, setVoucherFormValues] = useState<StockVoucherFormValues>(
    toStockVoucherFormValues(),
  );

  const [voucherLineVisible, setVoucherLineVisible] = useState(false);
  const [voucherLineTarget, setVoucherLineTarget] = useState<StockVoucher | null>(null);
  const [voucherLineValues, setVoucherLineValues] = useState<StockVoucherLineItemFormValues>(
    toStockVoucherLineItemFormValues(),
  );

  const [salesFormVisible, setSalesFormVisible] = useState(false);
  const [salesFormMode, setSalesFormMode] = useState<FormMode>('create');
  const [editingSales, setEditingSales] = useState<SalesTransaction | null>(null);
  const [salesFormValues, setSalesFormValues] = useState<SalesTransactionFormValues>(
    toSalesTransactionFormValues(),
  );

  const [salesLinesVisible, setSalesLinesVisible] = useState(false);
  const [salesLinesLoading, setSalesLinesLoading] = useState(false);
  const [salesLinesError, setSalesLinesError] = useState<string | null>(null);
  const [salesLinesTarget, setSalesLinesTarget] = useState<SalesTransaction | null>(null);
  const [salesLinesRows, setSalesLinesRows] = useState<SalesTransactionLine[]>([]);

  const [salesLineFormVisible, setSalesLineFormVisible] = useState(false);
  const [salesLineFormMode, setSalesLineFormMode] = useState<FormMode>('create');
  const [editingSalesLine, setEditingSalesLine] = useState<SalesTransactionLine | null>(null);
  const [salesLineFormValues, setSalesLineFormValues] = useState<SalesTransactionLineFormValues>(
    toSalesTransactionLineFormValues(),
  );
  const orderFormScrollRef = useRef<ScrollView | null>(null);
  const voucherLineFormScrollRef = useRef<ScrollView | null>(null);
  const salesLineFormScrollRef = useRef<ScrollView | null>(null);
  const orderFormValidation = useFormValidation<OrderFormField>(orderFormScrollRef);
  const voucherLineFormValidation =
    useFormValidation<VoucherLineFormField>(voucherLineFormScrollRef);
  const salesLineFormValidation =
    useFormValidation<SalesLineFormField>(salesLineFormScrollRef);

  const productOptions = useMemo(
    () => stockProducts.map((item) => ({ label: item.name, value: item.id })),
    [stockProducts],
  );
  const warehouseOptions = useMemo(
    () => stockWarehouses.map((item) => ({ label: item.name, value: item.id })),
    [stockWarehouses],
  );
  const contactOptions = useMemo(
    () =>
      stockContacts.map((item) => ({
        label: item.company ? `${item.name} (${item.company})` : item.name,
        value: item.id,
      })),
    [stockContacts],
  );

  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredOrders = useMemo(
    () =>
      unreadOrders.filter((order) => {
        if (!normalizedSearch) return true;
        return (
          order.orderNumber.toLowerCase().includes(normalizedSearch) ||
          (order.customerName ?? '').toLowerCase().includes(normalizedSearch) ||
          (order.notes ?? '').toLowerCase().includes(normalizedSearch)
        );
      }),
    [unreadOrders, normalizedSearch],
  );

  const filteredVouchers = useMemo(
    () =>
      stockVouchers.filter((voucher) => {
        if (!normalizedSearch) return true;
        return (
          (voucher.voucherReference ?? '').toLowerCase().includes(normalizedSearch) ||
          (voucher.notes ?? '').toLowerCase().includes(normalizedSearch) ||
          voucher.type.toLowerCase().includes(normalizedSearch)
        );
      }),
    [stockVouchers, normalizedSearch],
  );

  const filteredSales = useMemo(
    () =>
      salesTransactions.filter((transaction) => {
        if (!normalizedSearch) return true;
        return (
          transaction.id.toLowerCase().includes(normalizedSearch) ||
          (transaction.notes ?? '').toLowerCase().includes(normalizedSearch) ||
          transaction.status.toLowerCase().includes(normalizedSearch)
        );
      }),
    [salesTransactions, normalizedSearch],
  );

  // ─── Form helpers ─────────────────────────────────────────────────────────
  function resetOrderForm() {
    setOrderFormMode('create');
    setEditingOrder(null);
    setOrderFormValues(toOrderFormValues());
    orderFormValidation.reset();
  }
  function closeOrderForm() {
    setOrderFormVisible(false);
    resetOrderForm();
  }
  function resetVoucherForm() {
    setVoucherFormMode('create');
    setEditingVoucher(null);
    setVoucherFormValues(toStockVoucherFormValues());
  }
  function closeVoucherForm() {
    setVoucherFormVisible(false);
    resetVoucherForm();
  }
  function resetSalesForm() {
    setSalesFormMode('create');
    setEditingSales(null);
    setSalesFormValues(toSalesTransactionFormValues());
  }
  function closeSalesForm() {
    setSalesFormVisible(false);
    resetSalesForm();
  }
  function closeVoucherLineForm() {
    setVoucherLineVisible(false);
    setVoucherLineTarget(null);
    setVoucherLineValues(toStockVoucherLineItemFormValues());
    voucherLineFormValidation.reset();
  }
  function closeSalesLineForm() {
    setSalesLineFormVisible(false);
    setSalesLineFormMode('create');
    setEditingSalesLine(null);
    setSalesLineFormValues(toSalesTransactionLineFormValues());
    salesLineFormValidation.reset();
  }

  function openCreateSheet() {
    if (activeTab === 'orders') {
      resetOrderForm();
      setOrderFormVisible(true);
      return;
    }
    if (activeTab === 'stock') {
      resetVoucherForm();
      setVoucherFormVisible(true);
      return;
    }
    resetSalesForm();
    setSalesFormVisible(true);
  }

  function openEditOrderSheet(order: OrderSummary) {
    setOrderFormMode('edit');
    setEditingOrder(order);
    setOrderFormValues(toOrderFormValues(order));
    orderFormValidation.reset();
    setOrderFormVisible(true);
  }

  function openEditVoucherSheet(voucher: StockVoucher) {
    setVoucherFormMode('edit');
    setEditingVoucher(voucher);
    setVoucherFormValues(toStockVoucherFormValues(voucher));
    setVoucherFormVisible(true);
  }

  function openEditSalesSheet(transaction: SalesTransaction) {
    setSalesFormMode('edit');
    setEditingSales(transaction);
    setSalesFormValues(toSalesTransactionFormValues(transaction));
    setSalesFormVisible(true);
  }

  function openOrderStatusSheet(order: OrderSummary) {
    setOrderStatusTarget(order);
    setOrderStatusValues(toOrderStatusFormValues(order));
    setOrderStatusVisible(true);
  }

  async function openOrderDetails(order: OrderSummary) {
    setOrderDetailsVisible(true);
    setOrderDetailsLoading(true);
    setOrderDetailsError(null);
    try {
      const details = await loadOrderDetails(order.id);
      setOrderDetailsOrder(details.order);
      setOrderDetailsItems(details.items);
      setOrderDetailsStockOut(details.stockOut);
    } catch (error) {
      setOrderDetailsError(
        error instanceof Error ? error.message : 'Failed to load order details.',
      );
    } finally {
      setOrderDetailsLoading(false);
    }
  }

  async function openSalesLines(transaction: SalesTransaction) {
    setSalesLinesVisible(true);
    setSalesLinesTarget(transaction);
    setSalesLinesRows([]);
    setSalesLinesError(null);
    setSalesLinesLoading(true);
    try {
      const [refreshedTransaction, lines] = await Promise.all([
        loadSalesTransaction(transaction.id),
        loadSalesTransactionLines(transaction.id),
      ]);
      if (refreshedTransaction) setSalesLinesTarget(refreshedTransaction);
      setSalesLinesRows(lines);
    } catch (error) {
      setSalesLinesError(
        error instanceof Error ? error.message : 'Failed to load transaction lines.',
      );
    } finally {
      setSalesLinesLoading(false);
    }
  }

  async function refreshSalesLines() {
    if (!salesLinesTarget) return;
    setSalesLinesLoading(true);
    setSalesLinesError(null);
    try {
      const lines = await loadSalesTransactionLines(salesLinesTarget.id);
      setSalesLinesRows(lines);
    } catch (error) {
      setSalesLinesError(
        error instanceof Error ? error.message : 'Failed to refresh transaction lines.',
      );
    } finally {
      setSalesLinesLoading(false);
    }
  }

  // ─── Submit handlers ──────────────────────────────────────────────────────
  async function submitOrderForm() {
    const orderDate = orderFormValues.orderDate || new Date().toISOString().slice(0, 10);
    try {
      if (orderFormMode === 'create') {
        const productId = orderFormValues.productId.trim();
        const quantity = parseOptionalNumber(orderFormValues.quantity);
        const unitPrice = parseOptionalNumber(orderFormValues.unitPrice);
        const valid = orderFormValidation.validate([
          {
            field: 'productId',
            message: 'Product is required.',
            isValid: productId.length > 0,
          },
          {
            field: 'quantity',
            message: 'Enter a valid quantity greater than 0.',
            isValid: quantity !== undefined && quantity > 0,
          },
          {
            field: 'unitPrice',
            message: 'Enter a valid unit price greater than 0.',
            isValid: unitPrice !== undefined && unitPrice > 0,
          },
        ]);
        if (!valid || quantity === undefined || unitPrice === undefined) {
          showToast({
            message: 'Complete the highlighted fields.',
            variant: 'error',
          });
          return;
        }
        const selectedProduct = stockProducts.find((item) => item.id === productId);
        const subtotal = quantity * unitPrice;
        await createOrder({
          status: normalizeCreateOrderStatus(orderFormValues.status),
          contact_id: orderFormValues.contactId.trim() || undefined,
          order_date: orderDate,
          delivery_date: orderFormValues.deliveryDate.trim() || undefined,
          customer_name: orderFormValues.customerName.trim() || undefined,
          customer_email: orderFormValues.customerEmail.trim() || undefined,
          customer_phone: orderFormValues.customerPhone.trim() || undefined,
          customer_address: orderFormValues.customerAddress.trim() || undefined,
          customer_city: orderFormValues.customerCity.trim() || undefined,
          customer_postal_code: orderFormValues.customerPostalCode.trim() || undefined,
          shipping_address: orderFormValues.shippingAddress.trim() || undefined,
          payment_method: orderFormValues.paymentMethod.trim() || undefined,
          delivery_method: orderFormValues.deliveryMethod.trim() || undefined,
          source: 'mobile',
          notes: orderFormValues.notes.trim() || undefined,
          subtotal,
          total_amount: subtotal,
          order_items: [
            {
              product_id: productId,
              product_name: selectedProduct?.name ?? 'Product',
              quantity,
              unit_price: unitPrice,
            },
          ],
        });
        showToast({ message: 'Order created.', variant: 'success' });
      } else if (editingOrder) {
        await updateOrder(editingOrder.id, {
          status: normalizeOrderStatus(orderFormValues.status),
          order_date: orderDate,
          delivery_date: orderFormValues.deliveryDate.trim() || undefined,
          customer_name: orderFormValues.customerName.trim() || undefined,
          customer_email: orderFormValues.customerEmail.trim() || undefined,
          customer_phone: orderFormValues.customerPhone.trim() || undefined,
          customer_address: orderFormValues.customerAddress.trim() || undefined,
          customer_city: orderFormValues.customerCity.trim() || undefined,
          customer_postal_code: orderFormValues.customerPostalCode.trim() || undefined,
          shipping_address: orderFormValues.shippingAddress.trim() || undefined,
          payment_method: orderFormValues.paymentMethod.trim() || undefined,
          delivery_method: orderFormValues.deliveryMethod.trim() || undefined,
          notes: orderFormValues.notes.trim() || undefined,
        });
        showToast({ message: 'Order updated.', variant: 'success' });
      }
      closeOrderForm();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Order mutation failed.',
        variant: 'error',
      });
    }
  }

  async function submitOrderStatusForm() {
    if (!orderStatusTarget) return;
    try {
      await updateOrderStatus(orderStatusTarget.id, {
        status: normalizeOrderStatus(orderStatusValues.status),
      });
      showToast({ message: 'Order status updated.', variant: 'success' });
      setOrderStatusVisible(false);
      setOrderStatusTarget(null);
      setOrderStatusValues(toOrderStatusFormValues());
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Order status update failed.',
        variant: 'error',
      });
    }
  }

  async function submitVoucherForm() {
    try {
      if (voucherFormMode === 'create') {
        await createStockVoucher({
          type: normalizeStockVoucherType(voucherFormValues.type),
          status: normalizeStockVoucherStatus(voucherFormValues.status),
          contact_id: voucherFormValues.contactId.trim() || undefined,
          voucher_date: voucherFormValues.voucherDate.trim() || undefined,
          voucher_reference: voucherFormValues.voucherReference.trim() || undefined,
          source_type: voucherFormValues.sourceType.trim() || undefined,
          notes: voucherFormValues.notes.trim() || undefined,
        });
        showToast({ message: 'Stock voucher created.', variant: 'success' });
      } else if (editingVoucher) {
        await updateStockVoucher(editingVoucher.id, {
          type: normalizeStockVoucherType(voucherFormValues.type),
          status: normalizeStockVoucherStatus(voucherFormValues.status),
          contact_id: voucherFormValues.contactId.trim() || null,
          voucher_date: voucherFormValues.voucherDate.trim() || undefined,
          voucher_reference: voucherFormValues.voucherReference.trim() || null,
          source_type: voucherFormValues.sourceType.trim() || null,
          notes: voucherFormValues.notes.trim() || null,
        });
        showToast({ message: 'Stock voucher updated.', variant: 'success' });
      }
      closeVoucherForm();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Stock voucher mutation failed.',
        variant: 'error',
      });
    }
  }

  async function submitVoucherLineForm() {
    if (!voucherLineTarget) return;
    const productId = voucherLineValues.productId.trim();
    const warehouseId = voucherLineValues.warehouseId.trim();
    const quantity = parseOptionalNumber(voucherLineValues.quantity);
    const valid = voucherLineFormValidation.validate([
      {
        field: 'productId',
        message: 'Product is required.',
        isValid: productId.length > 0,
      },
      {
        field: 'warehouseId',
        message: 'Warehouse is required.',
        isValid: warehouseId.length > 0,
      },
      {
        field: 'quantity',
        message: 'Enter a valid quantity greater than 0.',
        isValid: quantity !== undefined && quantity > 0,
      },
    ]);
    if (!valid || quantity === undefined) {
      showToast({
        message: 'Complete the highlighted fields.',
        variant: 'error',
      });
      return;
    }
    try {
      await insertStockVoucherLineItems(voucherLineTarget.id, {
        items: [{ product_id: productId, warehouse_id: warehouseId, quantity }],
      });
      showToast({ message: 'Voucher line item saved.', variant: 'success' });
      closeVoucherLineForm();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Voucher line mutation failed.',
        variant: 'error',
      });
    }
  }

  async function submitSalesForm() {
    const transactionDate =
      salesFormValues.transactionDate || new Date().toISOString().slice(0, 10);
    try {
      if (salesFormMode === 'create') {
        await createSalesTransaction({
          status: normalizeSalesStatus(salesFormValues.status),
          transaction_date: transactionDate,
          price_type: normalizeSalesPriceType(salesFormValues.priceType),
          contact_id: salesFormValues.contactId.trim() || null,
          notes: salesFormValues.notes.trim() || null,
          subtotal: parseOptionalNumber(salesFormValues.subtotal),
          tax_amount: parseOptionalNumber(salesFormValues.taxAmount),
          total_amount: parseOptionalNumber(salesFormValues.totalAmount),
          affects_income: toYesNo(salesFormValues.affectsIncome) === 'yes',
        });
        showToast({ message: 'Sales transaction created.', variant: 'success' });
      } else if (editingSales) {
        await updateSalesTransaction(editingSales.id, {
          status: normalizeSalesStatus(salesFormValues.status),
          transaction_date: transactionDate,
          price_type: normalizeSalesPriceType(salesFormValues.priceType),
          contact_id: salesFormValues.contactId.trim() || null,
          notes: salesFormValues.notes.trim() || null,
          subtotal: parseOptionalNumber(salesFormValues.subtotal),
          tax_amount: parseOptionalNumber(salesFormValues.taxAmount),
          total_amount: parseOptionalNumber(salesFormValues.totalAmount),
          affects_income: toYesNo(salesFormValues.affectsIncome) === 'yes',
        });
        showToast({ message: 'Sales transaction updated.', variant: 'success' });
      }
      closeSalesForm();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Sales transaction mutation failed.',
        variant: 'error',
      });
    }
  }

  async function submitSalesLineForm() {
    if (!salesLinesTarget) return;
    const productId = salesLineFormValues.productId.trim();
    const warehouseId = salesLineFormValues.warehouseId.trim();
    const quantity = parseOptionalNumber(salesLineFormValues.quantity);
    const unitPrice = parseOptionalNumber(salesLineFormValues.unitPrice);
    const subtotal = parseOptionalNumber(salesLineFormValues.subtotal);
    const valid = salesLineFormValidation.validate([
      {
        field: 'productId',
        message: 'Product is required.',
        isValid: productId.length > 0,
      },
      {
        field: 'warehouseId',
        message: 'Warehouse is required.',
        isValid: warehouseId.length > 0,
      },
      {
        field: 'quantity',
        message: 'Enter a valid quantity greater than 0.',
        isValid: quantity !== undefined && quantity > 0,
      },
      {
        field: 'unitPrice',
        message: 'Enter a valid unit price greater than 0.',
        isValid: unitPrice !== undefined && unitPrice > 0,
      },
    ]);
    if (!valid || quantity === undefined || unitPrice === undefined) {
      showToast({
        message: 'Complete the highlighted fields.',
        variant: 'error',
      });
      return;
    }
    const selectedProduct = stockProducts.find((item) => item.id === productId);
    const nextLineNumber =
      salesLinesRows.reduce((max, row) => Math.max(max, row.lineNumber), 0) + 1;
    try {
      if (salesLineFormMode === 'create') {
        await createSalesTransactionLine(salesLinesTarget.id, {
          line_number: nextLineNumber,
          product_id: productId,
          product_name:
            salesLineFormValues.productName.trim() || selectedProduct?.name || 'Product',
          warehouse_id: warehouseId,
          quantity,
          unit_price: unitPrice,
          subtotal: subtotal ?? quantity * unitPrice,
        });
        showToast({ message: 'Sales line item created.', variant: 'success' });
      } else if (editingSalesLine) {
        await updateSalesTransactionLine(editingSalesLine.id, {
          line_number: editingSalesLine.lineNumber,
          product_id: productId,
          product_name:
            salesLineFormValues.productName.trim() || selectedProduct?.name || 'Product',
          warehouse_id: warehouseId,
          quantity,
          unit_price: unitPrice,
          subtotal: subtotal ?? quantity * unitPrice,
        });
        showToast({ message: 'Sales line item updated.', variant: 'success' });
      }
      closeSalesLineForm();
      await refreshSalesLines();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Sales line mutation failed.',
        variant: 'error',
      });
    }
  }

  async function submitConfirmAction() {
    if (!confirmTarget) return;
    try {
      if (confirmTarget.type === 'order-delete') {
        await deleteOrder(confirmTarget.item.id);
        showToast({ message: 'Order deleted.', variant: 'success' });
      }
      if (confirmTarget.type === 'voucher-delete') {
        await deleteStockVoucher(confirmTarget.item.id);
        showToast({ message: 'Stock voucher deleted.', variant: 'success' });
      }
      if (confirmTarget.type === 'voucher-delete-lines') {
        await deleteStockVoucherLineItems(confirmTarget.item.id);
        showToast({ message: 'Voucher line items cleared.', variant: 'success' });
      }
      if (confirmTarget.type === 'sales-complete') {
        await completeSalesTransaction(confirmTarget.item.id);
        showToast({ message: 'Sales transaction completed.', variant: 'success' });
      }
      if (confirmTarget.type === 'sales-line-delete') {
        await deleteSalesTransactionLine(confirmTarget.item.id);
        showToast({ message: 'Sales line deleted.', variant: 'success' });
        await refreshSalesLines();
      }
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Action failed.',
        variant: 'error',
      });
    } finally {
      setConfirmTarget(null);
    }
  }

  // ─── Quick action builders ────────────────────────────────────────────────
  function buildOrderQuickActions(order: OrderSummary): QuickAction[] {
    return [
      {
        key: 'view-details',
        icon: 'clipboard-text',
        label: 'View Details',
        color: 'green',
        onPress: () => {
          setDetailTarget(null);
          void openOrderDetails(order);
        },
      },
      {
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => {
          setDetailTarget(null);
          openEditOrderSheet(order);
        },
      },
      {
        key: 'validate-inv',
        icon: 'check-circle-outline',
        label: 'Validate Inv.',
        color: 'amber',
        onPress: () => {
          setDetailTarget(null);
          void loadOrderDetails(order.id)
            .then((details) => {
              const items = toInventoryItems(details.items);
              if (items.length === 0) {
                throw new Error(
                  'Order has no valid product line items for inventory validation.',
                );
              }
              return validateOrderInventory({ items });
            })
            .then(() =>
              showToast({ message: 'Inventory validation succeeded.', variant: 'success' }),
            )
            .catch((error) =>
              showToast({
                message:
                  error instanceof Error ? error.message : 'Inventory validation failed.',
                variant: 'error',
              }),
            );
        },
      },
      {
        key: 'allocate-inv',
        icon: 'package-variant',
        label: 'Allocate Inv.',
        color: 'amber',
        onPress: () => {
          setDetailTarget(null);
          void loadOrderDetails(order.id)
            .then((details) => {
              const items = toInventoryItems(details.items);
              if (items.length === 0) {
                throw new Error(
                  'Order has no valid product line items for allocation.',
                );
              }
              return allocateOrderInventory({ items });
            })
            .then(() =>
              showToast({ message: 'Inventory allocation succeeded.', variant: 'success' }),
            )
            .catch((error) =>
              showToast({
                message:
                  error instanceof Error ? error.message : 'Inventory allocation failed.',
                variant: 'error',
              }),
            );
        },
      },
      {
        key: 'confirm',
        icon: 'check-bold',
        label: 'Confirm',
        color: 'green',
        onPress: () => {
          setDetailTarget(null);
          void confirmOrder(order.id, { note: 'Confirmed from mobile Phase 10' })
            .then(() => showToast({ message: 'Order confirmed.', variant: 'success' }))
            .catch((error) =>
              showToast({
                message:
                  error instanceof Error ? error.message : 'Order confirmation failed.',
                variant: 'error',
              }),
            );
        },
      },
      {
        key: 'update-status',
        icon: 'update',
        label: 'Update Status',
        color: 'blue',
        onPress: () => {
          setDetailTarget(null);
          openOrderStatusSheet(order);
        },
      },
      {
        key: 'mark-read',
        icon: 'email-open-outline',
        label: 'Mark Read',
        color: 'blue',
        onPress: () => {
          setDetailTarget(null);
          void markOrderAsRead(order.id)
            .then(() => showToast({ message: 'Order marked as read.', variant: 'success' }))
            .catch((error) =>
              showToast({
                message: error instanceof Error ? error.message : 'Mark as read failed.',
                variant: 'error',
              }),
            );
        },
      },
      {
        key: 'stock-out',
        icon: 'warehouse',
        label: 'Stock-Out',
        color: 'amber',
        onPress: () => {
          setDetailTarget(null);
          void createStockOutForOrder(order.id)
            .then(() =>
              showToast({ message: 'Stock-out ensured for order.', variant: 'success' }),
            )
            .catch((error) =>
              showToast({
                message: error instanceof Error ? error.message : 'Create stock-out failed.',
                variant: 'error',
              }),
            );
        },
      },
      {
        key: 'delete',
        icon: 'delete-outline',
        label: 'Delete',
        color: 'red',
        onPress: () => {
          setDetailTarget(null);
          setConfirmTarget({ type: 'order-delete', item: order });
        },
      },
    ];
  }

  function buildVoucherQuickActions(voucher: StockVoucher): QuickAction[] {
    return [
      {
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => {
          setDetailTarget(null);
          openEditVoucherSheet(voucher);
        },
      },
      {
        key: 'post',
        icon: 'send-check',
        label: 'Mark Posted',
        color: 'green',
        onPress: () => {
          setDetailTarget(null);
          void updateStockVoucherStatus(voucher.id, { status: 'posted' })
            .then(() => showToast({ message: 'Voucher status updated.', variant: 'success' }))
            .catch((error) =>
              showToast({
                message: error instanceof Error ? error.message : 'Status update failed.',
                variant: 'error',
              }),
            );
        },
      },
      {
        key: 'add-line',
        icon: 'plus-box-outline',
        label: 'Add Line',
        color: 'amber',
        onPress: () => {
          setDetailTarget(null);
          setVoucherLineTarget(voucher);
          setVoucherLineValues(toStockVoucherLineItemFormValues());
          voucherLineFormValidation.reset();
          setVoucherLineVisible(true);
        },
      },
      {
        key: 'delete-lines',
        icon: 'table-remove',
        label: 'Delete Lines',
        color: 'red',
        onPress: () => {
          setDetailTarget(null);
          setConfirmTarget({ type: 'voucher-delete-lines', item: voucher });
        },
      },
      {
        key: 'delete',
        icon: 'delete-outline',
        label: 'Delete',
        color: 'red',
        onPress: () => {
          setDetailTarget(null);
          setConfirmTarget({ type: 'voucher-delete', item: voucher });
        },
      },
    ];
  }

  function buildSalesQuickActions(transaction: SalesTransaction): QuickAction[] {
    return [
      {
        key: 'manage-lines',
        icon: 'format-list-bulleted',
        label: 'Manage Lines',
        color: 'green',
        onPress: () => {
          setDetailTarget(null);
          void openSalesLines(transaction);
        },
      },
      {
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => {
          setDetailTarget(null);
          openEditSalesSheet(transaction);
        },
      },
      {
        key: 'complete',
        icon: 'check-circle',
        label: 'Complete',
        color: 'amber',
        onPress: () => {
          setDetailTarget(null);
          setConfirmTarget({ type: 'sales-complete', item: transaction });
        },
      },
    ];
  }

  function buildSalesLineQuickActions(line: SalesTransactionLine): QuickAction[] {
    return [
      {
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => {
          setDetailTarget(null);
          setSalesLineFormMode('edit');
          setEditingSalesLine(line);
          setSalesLineFormValues({
            productId: line.productId ?? '',
            productName: line.productName,
            warehouseId: line.warehouseId ?? '',
            quantity: line.quantity.toString(),
            unitPrice: line.unitPrice.toString(),
            subtotal: line.subtotal.toString(),
          });
          salesLineFormValidation.reset();
          setSalesLineFormVisible(true);
        },
      },
      {
        key: 'delete',
        icon: 'delete-outline',
        label: 'Delete',
        color: 'red',
        onPress: () => {
          setDetailTarget(null);
          setConfirmTarget({ type: 'sales-line-delete', item: line });
        },
      },
    ];
  }

  const ordersCount = filteredOrders.length;
  const stockCount = filteredVouchers.length;
  const salesCount = filteredSales.length;
  const activeRowsCount =
    activeTab === 'orders' ? ordersCount : activeTab === 'stock' ? stockCount : salesCount;

  const pillTabOptions = [
    {
      label: unreadOrderCount > 0 ? `Orders (${unreadOrderCount})` : 'Orders',
      value: 'orders' as Phase10Tab,
    },
    { label: `Stock (${stockVouchers.length})`, value: 'stock' as Phase10Tab },
    { label: `Sales (${salesTransactions.length})`, value: 'sales' as Phase10Tab },
  ];

  // ─── Detail cell builders ──────────────────────────────────────────────────
  const orderDetailCells: InfoGridCell[] | undefined =
    detailTarget?.type === 'order'
      ? [
          { label: 'Status', value: detailTarget.item.status },
          { label: 'Items', value: String(detailTarget.item.itemsCount) },
          { label: 'Read', value: detailTarget.item.readAt ? 'Read' : 'Unread' },
          { label: 'Payment', value: detailTarget.item.paymentMethod ?? 'N/A' },
        ]
      : undefined;

  const voucherDetailCells: InfoGridCell[] | undefined =
    detailTarget?.type === 'voucher'
      ? [
          { label: 'Type', value: detailTarget.item.type.toUpperCase() },
          { label: 'Status', value: detailTarget.item.status },
          { label: 'Lines', value: String(detailTarget.item.lineItemsCount) },
          { label: 'Date', value: detailTarget.item.voucherDate ?? 'N/A' },
        ]
      : undefined;

  const salesDetailCells: InfoGridCell[] | undefined =
    detailTarget?.type === 'sales'
      ? [
          { label: 'Status', value: detailTarget.item.status },
          { label: 'Price type', value: detailTarget.item.priceType ?? 'N/A' },
          { label: 'Total', value: `${money(detailTarget.item.totalAmount)} USD` },
          { label: 'Date', value: detailTarget.item.transactionDate ?? 'N/A' },
        ]
      : undefined;

  const salesLineDetailCells: InfoGridCell[] | undefined =
    detailTarget?.type === 'sales-line'
      ? [
          { label: 'Qty', value: String(detailTarget.item.quantity) },
          { label: 'Unit price', value: money(detailTarget.item.unitPrice) },
          { label: 'Subtotal', value: money(detailTarget.item.subtotal) },
          { label: 'Line #', value: String(detailTarget.item.lineNumber) },
        ]
      : undefined;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <AppScreen padded={false}>
      {/* Sticky header */}
      <View style={styles.header}>
        <View style={styles.headerLead}>
          <HeaderMenuButton testID="orders-header-menu" />
          <Text style={styles.headerTitle}>
            {t('system', 'headers.orders.title', 'Orders & Sales')}
          </Text>
        </View>
        <SystemHeaderActions notificationTestID="orders-header-notifications">
          <HeaderIconButton icon="plus" filled onPress={openCreateSheet} />
        </SystemHeaderActions>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabsWrap}>
        <PillTabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Phase10Tab)}
          tabs={pillTabOptions}
        />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder={`Search ${activeTab}`}
        />
      </View>

      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Stats strip */}
          <StatStrip
            items={[
              {
                label: 'Unread Orders',
                value: String(unreadOrderCount),
                color: unreadOrderCount > 0 ? 'amber' : 'green',
              },
              { label: 'Stock Vouchers', value: String(stockVouchers.length), color: 'green' },
              { label: 'Sales', value: String(salesTransactions.length), color: 'green' },
              { label: 'Inventory', value: String(productInventory.length), color: 'amber' },
            ]}
          />

          {/* Farm context badge */}
          {farmContext ? (
            <View style={styles.farmBadge}>
              <Text style={styles.farmBadgeText}>
                {farmContext.name} · {farmContext.subscriptionStatus ?? 'active'}
              </Text>
            </View>
          ) : null}

          {/* Section header */}
          <SectionHeader
            title={`${toEntityLabel(activeTab)} records`}
            trailing={String(activeRowsCount)}
          />

          {/* List */}
          {isLoading ? (
            <View style={styles.gap}>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </View>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : activeRowsCount === 0 ? (
            <EmptyState
              title={`No ${activeTab} records`}
              message="Try another search or create a new record."
              actionLabel={`Create ${toEntityLabel(activeTab)}`}
              onAction={openCreateSheet}
            />
          ) : (
            <View style={styles.gap}>
              {activeTab === 'orders'
                ? filteredOrders.map((order) => (
                    <ListRow
                      key={order.id}
                      icon="clipboard-list"
                      title={order.orderNumber}
                      subtitle={
                        order.customerName
                          ? `${order.customerName} · ${money(order.totalAmount)} USD`
                          : `${money(order.totalAmount)} USD`
                      }
                      badge={
                        <DotBadge
                          label={order.readAt ? order.status : 'Unread'}
                          variant={
                            order.readAt ? statusDotBadgeVariant(order.status) : 'warning'
                          }
                        />
                      }
                      onPress={() => setDetailTarget({ type: 'order', item: order })}
                    />
                  ))
                : null}

              {activeTab === 'stock'
                ? filteredVouchers.map((voucher) => (
                    <ListRow
                      key={voucher.id}
                      icon="warehouse"
                      title={voucher.voucherReference || voucher.id.slice(0, 8)}
                      subtitle={`${voucher.type.toUpperCase()} · ${voucher.voucherDate ?? 'No date'} · ${voucher.lineItemsCount} lines`}
                      badge={
                        <DotBadge
                          label={voucher.status}
                          variant={statusDotBadgeVariant(voucher.status)}
                        />
                      }
                      onPress={() => setDetailTarget({ type: 'voucher', item: voucher })}
                    />
                  ))
                : null}

              {activeTab === 'sales'
                ? filteredSales.map((transaction) => (
                    <ListRow
                      key={transaction.id}
                      icon="cash-multiple"
                      title={transaction.id.slice(0, 12)}
                      subtitle={`${transaction.transactionDate ?? 'No date'} · ${money(transaction.totalAmount)} USD`}
                      badge={
                        <DotBadge
                          label={transaction.status}
                          variant={statusDotBadgeVariant(transaction.status)}
                        />
                      }
                      onPress={() => setDetailTarget({ type: 'sales', item: transaction })}
                    />
                  ))
                : null}
            </View>
          )}
        </ScrollView>
      </PullToRefreshContainer>

      {/* ─── Order detail BottomSheet ────────────────────────────────── */}
      <BottomSheet
        visible={detailTarget?.type === 'order'}
        onDismiss={() => setDetailTarget(null)}
        title="Order"
      >
        {detailTarget?.type === 'order' ? (
          <>
            <ProfileCard
              icon="clipboard-list"
              name={detailTarget.item.orderNumber}
              subtitle={
                detailTarget.item.customerName
                  ? `${detailTarget.item.customerName} · ${money(detailTarget.item.totalAmount)} USD`
                  : `${money(detailTarget.item.totalAmount)} USD`
              }
              cells={orderDetailCells ?? []}
            />
            <QuickActionGrid actions={buildOrderQuickActions(detailTarget.item)} />
          </>
        ) : null}
      </BottomSheet>

      {/* ─── Voucher detail BottomSheet ──────────────────────────────── */}
      <BottomSheet
        visible={detailTarget?.type === 'voucher'}
        onDismiss={() => setDetailTarget(null)}
        title="Stock Voucher"
      >
        {detailTarget?.type === 'voucher' ? (
          <>
            <ProfileCard
              icon="warehouse"
              name={detailTarget.item.voucherReference || detailTarget.item.id.slice(0, 8)}
              subtitle={`${detailTarget.item.type.toUpperCase()} · ${detailTarget.item.voucherDate ?? 'No date'}`}
              cells={voucherDetailCells ?? []}
            />
            <QuickActionGrid actions={buildVoucherQuickActions(detailTarget.item)} />
          </>
        ) : null}
      </BottomSheet>

      {/* ─── Sales detail BottomSheet ────────────────────────────────── */}
      <BottomSheet
        visible={detailTarget?.type === 'sales'}
        onDismiss={() => setDetailTarget(null)}
        title="Sales Transaction"
      >
        {detailTarget?.type === 'sales' ? (
          <>
            <ProfileCard
              icon="cash-multiple"
              name={detailTarget.item.id.slice(0, 12)}
              subtitle={`${detailTarget.item.transactionDate ?? 'No date'} · ${money(detailTarget.item.totalAmount)} USD`}
              cells={salesDetailCells ?? []}
            />
            <QuickActionGrid actions={buildSalesQuickActions(detailTarget.item)} />
          </>
        ) : null}
      </BottomSheet>

      {/* ─── Sales-line detail BottomSheet ───────────────────────────── */}
      <BottomSheet
        visible={detailTarget?.type === 'sales-line'}
        onDismiss={() => setDetailTarget(null)}
        title="Sales Line Item"
      >
        {detailTarget?.type === 'sales-line' ? (
          <>
            <ProfileCard
              icon="barcode"
              name={detailTarget.item.productName}
              subtitle={`Qty ${detailTarget.item.quantity} · ${money(detailTarget.item.unitPrice)} / unit`}
              cells={salesLineDetailCells ?? []}
            />
            <QuickActionGrid actions={buildSalesLineQuickActions(detailTarget.item)} />
          </>
        ) : null}
      </BottomSheet>

      {/* ─── Order details view ──────────────────────────────────────── */}
      <BottomSheet
        visible={orderDetailsVisible}
        onDismiss={() => {
          setOrderDetailsVisible(false);
          setOrderDetailsError(null);
          setOrderDetailsOrder(null);
          setOrderDetailsItems([]);
          setOrderDetailsStockOut(false);
        }}
        title="Order Details"
      >
        {orderDetailsLoading ? (
          <View style={styles.gap}>
            <Skeleton height={56} />
            <Skeleton height={56} />
          </View>
        ) : orderDetailsError ? (
          <ErrorState
            message={orderDetailsError}
            onRetry={() => orderDetailsOrder && void openOrderDetails(orderDetailsOrder)}
          />
        ) : orderDetailsOrder ? (
          <>
            <ProfileCard
              icon="clipboard-text"
              name={orderDetailsOrder.orderNumber}
              subtitle={`${orderDetailsOrder.status} · ${money(orderDetailsOrder.totalAmount)} USD`}
              cells={[
                { label: 'Stock-out', value: orderDetailsStockOut ? 'Yes' : 'No' },
                { label: 'Items', value: String(orderDetailsItems.length) },
              ]}
            />
            {orderDetailsItems.length === 0 ? (
              <EmptyState title="No order items" message="This order has no line items." />
            ) : (
              <View style={styles.gap}>
                {orderDetailsItems.map((item) => (
                  <ListRow
                    key={item.id}
                    icon="package-variant"
                    iconVariant="neutral"
                    title={item.productName}
                    subtitle={`Qty ${item.quantity} · Unit ${money(item.unitPrice)} · Total ${money(item.totalPrice)}`}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <EmptyState title="No details" message="Select an order to view details." />
        )}
      </BottomSheet>

      {/* ─── Order form ──────────────────────────────────────────────── */}
      <BottomSheet
        visible={orderFormVisible}
        onDismiss={closeOrderForm}
        scrollViewRef={orderFormScrollRef}
        title={orderFormMode === 'create' ? 'Create Order' : 'Edit Order'}
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeOrderForm}
                disabled={isMutating}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label={orderFormMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitOrderForm()}
                loading={isMutating}
                disabled={isMutating}
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={orderFormValidation.providerValue}>
          <FormField label="Status">
            <AppSelect
              value={orderFormValues.status}
              onChange={(v) => setOrderFormValues((p) => ({ ...p, status: v }))}
              options={ORDER_STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />
          </FormField>
          <FormField label="Order date">
            <AppDatePicker
              value={orderFormValues.orderDate || null}
              onChange={(v) => setOrderFormValues((p) => ({ ...p, orderDate: v ?? '' }))}
              placeholder="Select order date"
            />
          </FormField>
          <FormField label="Delivery date">
            <AppDatePicker
              value={orderFormValues.deliveryDate || null}
              onChange={(v) => setOrderFormValues((p) => ({ ...p, deliveryDate: v ?? '' }))}
              placeholder="Optional delivery date"
            />
          </FormField>
          <FormField label="Contact">
            <AppSelect
              value={orderFormValues.contactId || '__none__'}
              onChange={(v) =>
                setOrderFormValues((p) => ({ ...p, contactId: v === '__none__' ? '' : v }))
              }
              options={[{ label: 'No contact', value: '__none__' }, ...contactOptions]}
            />
          </FormField>
          <FormField label="Customer name">
            <AppInput
              value={orderFormValues.customerName}
              onChangeText={(v) => setOrderFormValues((p) => ({ ...p, customerName: v }))}
              placeholder="Optional customer name"
            />
          </FormField>
          <FormField label="Payment method">
            <AppInput
              value={orderFormValues.paymentMethod}
              onChangeText={(v) => setOrderFormValues((p) => ({ ...p, paymentMethod: v }))}
              placeholder="cash, card, transfer"
            />
          </FormField>
          {orderFormMode === 'create' ? (
            <>
              <FormField label="Product" name="productId" required>
                <AppSelect
                  value={orderFormValues.productId || '__none__'}
                  onChange={(v) => {
                    orderFormValidation.clearFieldError('productId');
                    setOrderFormValues((p) => ({
                      ...p,
                      productId: v === '__none__' ? '' : v,
                    }));
                  }}
                  options={[{ label: 'Select product', value: '__none__' }, ...productOptions]}
                />
              </FormField>
              <FormField label="Quantity" name="quantity" required>
                <AppInput
                  value={orderFormValues.quantity}
                  onChangeText={(v) => {
                    orderFormValidation.clearFieldError('quantity');
                    setOrderFormValues((p) => ({ ...p, quantity: v }));
                  }}
                  placeholder="1"
                />
              </FormField>
              <FormField label="Unit price" name="unitPrice" required>
                <AppInput
                  value={orderFormValues.unitPrice}
                  onChangeText={(v) => {
                    orderFormValidation.clearFieldError('unitPrice');
                    setOrderFormValues((p) => ({ ...p, unitPrice: v }));
                  }}
                  placeholder="1.00"
                />
              </FormField>
            </>
          ) : null}
          <FormField label="Notes">
            <AppTextArea
              value={orderFormValues.notes}
              onChangeText={(v) => setOrderFormValues((p) => ({ ...p, notes: v }))}
              placeholder="Optional notes"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ─── Order status form ───────────────────────────────────────── */}
      <BottomSheet
        visible={orderStatusVisible}
        onDismiss={() => {
          setOrderStatusVisible(false);
          setOrderStatusTarget(null);
        }}
        title="Update Order Status"
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={() => {
                  setOrderStatusVisible(false);
                  setOrderStatusTarget(null);
                }}
                disabled={isMutating}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label="Save"
                onPress={() => void submitOrderStatusForm()}
                loading={isMutating}
                disabled={isMutating || !orderStatusTarget}
              />
            </View>
          </View>
        }
      >
        <FormField label="Status">
          <AppSelect
            value={orderStatusValues.status}
            onChange={(v) => setOrderStatusValues({ status: v })}
            options={ORDER_STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          />
        </FormField>
      </BottomSheet>

      {/* ─── Voucher form ────────────────────────────────────────────── */}
      <BottomSheet
        visible={voucherFormVisible}
        onDismiss={closeVoucherForm}
        title={voucherFormMode === 'create' ? 'Create Stock Voucher' : 'Edit Stock Voucher'}
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeVoucherForm}
                disabled={isMutating}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label={voucherFormMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitVoucherForm()}
                loading={isMutating}
                disabled={isMutating}
              />
            </View>
          </View>
        }
      >
        <FormField label="Type" required>
          <AppSelect
            value={voucherFormValues.type}
            onChange={(v) => setVoucherFormValues((p) => ({ ...p, type: v }))}
            options={STOCK_VOUCHER_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          />
        </FormField>
        <FormField label="Status">
          <AppSelect
            value={voucherFormValues.status}
            onChange={(v) => setVoucherFormValues((p) => ({ ...p, status: v }))}
            options={STOCK_VOUCHER_STATUS_OPTIONS.map((o) => ({
              label: o.label,
              value: o.value,
            }))}
          />
        </FormField>
        <FormField label="Voucher date">
          <AppDatePicker
            value={voucherFormValues.voucherDate || null}
            onChange={(v) => setVoucherFormValues((p) => ({ ...p, voucherDate: v ?? '' }))}
            placeholder="Select voucher date"
          />
        </FormField>
        <FormField label="Contact">
          <AppSelect
            value={voucherFormValues.contactId || '__none__'}
            onChange={(v) =>
              setVoucherFormValues((p) => ({ ...p, contactId: v === '__none__' ? '' : v }))
            }
            options={[{ label: 'No contact', value: '__none__' }, ...contactOptions]}
          />
        </FormField>
        <FormField label="Reference">
          <AppInput
            value={voucherFormValues.voucherReference}
            onChangeText={(v) => setVoucherFormValues((p) => ({ ...p, voucherReference: v }))}
            placeholder="Optional reference"
          />
        </FormField>
        <FormField label="Source type">
          <AppInput
            value={voucherFormValues.sourceType}
            onChangeText={(v) => setVoucherFormValues((p) => ({ ...p, sourceType: v }))}
            placeholder="manual_adjustment"
          />
        </FormField>
        <FormField label="Notes">
          <AppTextArea
            value={voucherFormValues.notes}
            onChangeText={(v) => setVoucherFormValues((p) => ({ ...p, notes: v }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      {/* ─── Voucher line item form ──────────────────────────────────── */}
      <BottomSheet
        visible={voucherLineVisible}
        onDismiss={closeVoucherLineForm}
        scrollViewRef={voucherLineFormScrollRef}
        title="Add Voucher Line Item"
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeVoucherLineForm}
                disabled={isMutating}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label="Save"
                onPress={() => void submitVoucherLineForm()}
                loading={isMutating}
                disabled={isMutating || !voucherLineTarget}
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={voucherLineFormValidation.providerValue}>
          <FormField label="Product" name="productId" required>
            <AppSelect
              value={voucherLineValues.productId || '__none__'}
              onChange={(v) => {
                voucherLineFormValidation.clearFieldError('productId');
                setVoucherLineValues((p) => ({ ...p, productId: v === '__none__' ? '' : v }));
              }}
              options={[{ label: 'Select product', value: '__none__' }, ...productOptions]}
            />
          </FormField>
          <FormField label="Warehouse" name="warehouseId" required>
            <AppSelect
              value={voucherLineValues.warehouseId || '__none__'}
              onChange={(v) => {
                voucherLineFormValidation.clearFieldError('warehouseId');
                setVoucherLineValues((p) => ({ ...p, warehouseId: v === '__none__' ? '' : v }));
              }}
              options={[{ label: 'Select warehouse', value: '__none__' }, ...warehouseOptions]}
            />
          </FormField>
          <FormField label="Quantity" name="quantity" required>
            <AppInput
              value={voucherLineValues.quantity}
              onChangeText={(v) => {
                voucherLineFormValidation.clearFieldError('quantity');
                setVoucherLineValues((p) => ({ ...p, quantity: v }));
              }}
              placeholder="1"
            />
          </FormField>
          <FormField label="Batch number">
            <AppInput
              value={voucherLineValues.batchNumber}
              onChangeText={(v) => setVoucherLineValues((p) => ({ ...p, batchNumber: v }))}
              placeholder="Optional batch"
            />
          </FormField>
          <FormField label="Manufacturing date">
            <AppDatePicker
              value={voucherLineValues.manufacturingDate || null}
              onChange={(v) =>
                setVoucherLineValues((p) => ({ ...p, manufacturingDate: v ?? '' }))
              }
              placeholder="Optional date"
            />
          </FormField>
          <FormField label="Expiry date">
            <AppDatePicker
              value={voucherLineValues.expiryDate || null}
              onChange={(v) => setVoucherLineValues((p) => ({ ...p, expiryDate: v ?? '' }))}
              placeholder="Optional date"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ─── Sales transaction form ──────────────────────────────────── */}
      <BottomSheet
        visible={salesFormVisible}
        onDismiss={closeSalesForm}
        title={
          salesFormMode === 'create' ? 'Create Sales Transaction' : 'Edit Sales Transaction'
        }
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeSalesForm}
                disabled={isMutating}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label={salesFormMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitSalesForm()}
                loading={isMutating}
                disabled={isMutating}
              />
            </View>
          </View>
        }
      >
        <FormField label="Status">
          <AppSelect
            value={salesFormValues.status}
            onChange={(v) => setSalesFormValues((p) => ({ ...p, status: v }))}
            options={SALES_STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          />
        </FormField>
        <FormField label="Transaction date">
          <AppDatePicker
            value={salesFormValues.transactionDate || null}
            onChange={(v) => setSalesFormValues((p) => ({ ...p, transactionDate: v ?? '' }))}
            placeholder="Select transaction date"
          />
        </FormField>
        <FormField label="Price type">
          <AppSelect
            value={salesFormValues.priceType}
            onChange={(v) => setSalesFormValues((p) => ({ ...p, priceType: v }))}
            options={SALES_PRICE_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          />
        </FormField>
        <FormField label="Contact">
          <AppSelect
            value={salesFormValues.contactId || '__none__'}
            onChange={(v) =>
              setSalesFormValues((p) => ({ ...p, contactId: v === '__none__' ? '' : v }))
            }
            options={[{ label: 'No contact', value: '__none__' }, ...contactOptions]}
          />
        </FormField>
        <FormField label="Subtotal">
          <AppInput
            value={salesFormValues.subtotal}
            onChangeText={(v) => setSalesFormValues((p) => ({ ...p, subtotal: v }))}
            placeholder="Optional subtotal"
          />
        </FormField>
        <FormField label="Tax amount">
          <AppInput
            value={salesFormValues.taxAmount}
            onChangeText={(v) => setSalesFormValues((p) => ({ ...p, taxAmount: v }))}
            placeholder="Optional tax"
          />
        </FormField>
        <FormField label="Total amount">
          <AppInput
            value={salesFormValues.totalAmount}
            onChangeText={(v) => setSalesFormValues((p) => ({ ...p, totalAmount: v }))}
            placeholder="Optional total"
          />
        </FormField>
        <FormField label="Affects income">
          <AppSelect
            value={salesFormValues.affectsIncome}
            onChange={(v) =>
              setSalesFormValues((p) => ({
                ...p,
                affectsIncome: v === 'yes' ? 'yes' : 'no',
              }))
            }
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
          />
        </FormField>
        <FormField label="Notes">
          <AppTextArea
            value={salesFormValues.notes}
            onChangeText={(v) => setSalesFormValues((p) => ({ ...p, notes: v }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      {/* ─── Sales lines manager ─────────────────────────────────────── */}
      <BottomSheet
        visible={salesLinesVisible}
        onDismiss={() => {
          setSalesLinesVisible(false);
          setSalesLinesTarget(null);
          setSalesLinesRows([]);
          setSalesLinesError(null);
          closeSalesLineForm();
          setDetailTarget(null);
        }}
        title="Sales Transaction Lines"
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Close"
                mode="outlined"
                tone="neutral"
                onPress={() => {
                  setSalesLinesVisible(false);
                  setSalesLinesTarget(null);
                  closeSalesLineForm();
                }}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label="Add Line"
                onPress={() => {
                    setSalesLineFormMode('create');
                    setEditingSalesLine(null);
                    setSalesLineFormValues(toSalesTransactionLineFormValues());
                    salesLineFormValidation.reset();
                    setSalesLineFormVisible(true);
                  }}
                disabled={!salesLinesTarget}
              />
            </View>
          </View>
        }
      >
        {salesLinesTarget ? (
          <ProfileCard
            icon="receipt"
            name={salesLinesTarget.id.slice(0, 12)}
            subtitle={`${salesLinesTarget.status} · ${money(salesLinesTarget.totalAmount)} USD`}
            cells={[
              { label: 'Status', value: salesLinesTarget.status },
              { label: 'Price type', value: salesLinesTarget.priceType ?? 'N/A' },
            ]}
          />
        ) : null}
        {salesLinesLoading ? (
          <View style={styles.gap}>
            <Skeleton height={56} />
            <Skeleton height={56} />
          </View>
        ) : salesLinesError ? (
          <ErrorState message={salesLinesError} onRetry={() => void refreshSalesLines()} />
        ) : salesLinesRows.length === 0 ? (
          <EmptyState title="No lines" message="Add line items for this transaction." />
        ) : (
          <View style={styles.gap}>
            {salesLinesRows.map((line) => (
              <ListRow
                key={line.id}
                icon="barcode"
                iconVariant="neutral"
                title={line.productName}
                subtitle={`Qty ${line.quantity} · Unit ${money(line.unitPrice)} · Sub ${money(line.subtotal)}`}
                onPress={() => setDetailTarget({ type: 'sales-line', item: line })}
              />
            ))}
          </View>
        )}
      </BottomSheet>

      {/* ─── Sales line form ─────────────────────────────────────────── */}
      <BottomSheet
        visible={salesLineFormVisible}
        onDismiss={closeSalesLineForm}
        scrollViewRef={salesLineFormScrollRef}
        title={salesLineFormMode === 'create' ? 'Add Sales Line' : 'Edit Sales Line'}
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeSalesLineForm}
                disabled={isMutating}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label={salesLineFormMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitSalesLineForm()}
                loading={isMutating}
                disabled={isMutating || !salesLinesTarget}
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={salesLineFormValidation.providerValue}>
          <FormField label="Product" name="productId" required>
            <AppSelect
              value={salesLineFormValues.productId || '__none__'}
              onChange={(v) => {
                salesLineFormValidation.clearFieldError('productId');
                setSalesLineFormValues((p) => ({ ...p, productId: v === '__none__' ? '' : v }));
              }}
              options={[{ label: 'Select product', value: '__none__' }, ...productOptions]}
            />
          </FormField>
          <FormField label="Product name">
            <AppInput
              value={salesLineFormValues.productName}
              onChangeText={(v) => setSalesLineFormValues((p) => ({ ...p, productName: v }))}
              placeholder="Optional override"
            />
          </FormField>
          <FormField label="Warehouse" name="warehouseId" required>
            <AppSelect
              value={salesLineFormValues.warehouseId || '__none__'}
              onChange={(v) => {
                salesLineFormValidation.clearFieldError('warehouseId');
                setSalesLineFormValues((p) => ({ ...p, warehouseId: v === '__none__' ? '' : v }));
              }}
              options={[{ label: 'Select warehouse', value: '__none__' }, ...warehouseOptions]}
            />
          </FormField>
          <FormField label="Quantity" name="quantity" required>
            <AppInput
              value={salesLineFormValues.quantity}
              onChangeText={(v) => {
                salesLineFormValidation.clearFieldError('quantity');
                setSalesLineFormValues((p) => ({ ...p, quantity: v }));
              }}
              placeholder="1"
            />
          </FormField>
          <FormField label="Unit price" name="unitPrice" required>
            <AppInput
              value={salesLineFormValues.unitPrice}
              onChangeText={(v) => {
                salesLineFormValidation.clearFieldError('unitPrice');
                setSalesLineFormValues((p) => ({ ...p, unitPrice: v }));
              }}
              placeholder="1.00"
            />
          </FormField>
          <FormField label="Subtotal">
            <AppInput
              value={salesLineFormValues.subtotal}
              onChangeText={(v) => setSalesLineFormValues((p) => ({ ...p, subtotal: v }))}
              placeholder="Optional subtotal"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ─── Confirm dialogs ──────────────────────────────────────────── */}
      <ConfirmDialog
        visible={Boolean(confirmTarget)}
        title={
          confirmTarget?.type === 'order-delete'
            ? 'Delete Order'
            : confirmTarget?.type === 'voucher-delete'
              ? 'Delete Voucher'
              : confirmTarget?.type === 'voucher-delete-lines'
                ? 'Delete Voucher Lines'
                : confirmTarget?.type === 'sales-complete'
                  ? 'Complete Transaction'
                  : 'Delete Sales Line'
        }
        message={
          confirmTarget?.type === 'order-delete'
            ? 'Delete this order record?'
            : confirmTarget?.type === 'voucher-delete'
              ? 'Delete this stock voucher?'
              : confirmTarget?.type === 'voucher-delete-lines'
                ? 'Delete all line items from this voucher?'
                : confirmTarget?.type === 'sales-complete'
                  ? 'Complete this sales transaction now?'
                  : 'Delete this sales line item?'
        }
        confirmLabel={confirmTarget?.type === 'sales-complete' ? 'Complete' : 'Confirm'}
        confirmTone={confirmTarget?.type === 'sales-complete' ? 'primary' : 'destructive'}
        confirmLoading={isMutating}
        confirmDisabled={isMutating}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => void submitConfirmAction()}
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
    alignItems: 'center',
    gap: 8,
  },
  tabsWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
    backgroundColor: palette.background,
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
  farmBadge: {
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.muted,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  farmBadgeText: {
    fontSize: 12,
    color: palette.primaryDark,
    fontWeight: '500',
  },
  gap: {
    gap: 8,
  },
  formFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  formBtn: {
    flex: 1,
  },
});
