import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type {
  OrderItem,
  OrderSummary,
  SalesTransaction,
  SalesTransactionLine,
  StockVoucher,
} from '../../../api/modules/orders';
import {
  ActionSheet,
  type ActionSheetAction,
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
  normalizeCreateOrderStatus,
  normalizeOrderStatus,
  normalizeSalesPriceType,
  normalizeSalesStatus,
  normalizeStockVoucherStatus,
  normalizeStockVoucherType,
  ORDER_STATUS_OPTIONS,
  parseOptionalNumber,
  PHASE10_TAB_OPTIONS,
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

type ActionTarget =
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

function statusBadgeVariant(
  status: string,
): 'success' | 'warning' | 'destructive' | 'neutral' {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'delivered' || normalized === 'confirmed' || normalized === 'completed') {
    return 'success';
  }

  if (normalized === 'cancelled') {
    return 'destructive';
  }

  if (normalized === 'pending' || normalized === 'draft') {
    return 'warning';
  }

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
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
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

  function resetOrderForm() {
    setOrderFormMode('create');
    setEditingOrder(null);
    setOrderFormValues(toOrderFormValues());
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
      const message = error instanceof Error ? error.message : 'Failed to load order details.';
      setOrderDetailsError(message);
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
      if (refreshedTransaction) {
        setSalesLinesTarget(refreshedTransaction);
      }
      setSalesLinesRows(lines);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load transaction lines.';
      setSalesLinesError(message);
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
      const message = error instanceof Error ? error.message : 'Failed to refresh transaction lines.';
      setSalesLinesError(message);
    } finally {
      setSalesLinesLoading(false);
    }
  }

  async function submitOrderForm() {
    const orderDate = orderFormValues.orderDate || new Date().toISOString().slice(0, 10);

    try {
      if (orderFormMode === 'create') {
        const productId = orderFormValues.productId.trim();
        const selectedProduct = stockProducts.find((item) => item.id === productId);
        const quantity = parseOptionalNumber(orderFormValues.quantity) ?? Number.NaN;
        const unitPrice = parseOptionalNumber(orderFormValues.unitPrice) ?? Number.NaN;

        if (!productId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
          showToast({ message: 'Product, quantity, and unit price are required.', variant: 'error' });
          return;
        }

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
      const message = error instanceof Error ? error.message : 'Order mutation failed.';
      showToast({ message, variant: 'error' });
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
      const message = error instanceof Error ? error.message : 'Order status update failed.';
      showToast({ message, variant: 'error' });
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
      const message = error instanceof Error ? error.message : 'Stock voucher mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitVoucherLineForm() {
    if (!voucherLineTarget) return;

    const productId = voucherLineValues.productId.trim();
    const warehouseId = voucherLineValues.warehouseId.trim();
    const quantity = parseOptionalNumber(voucherLineValues.quantity) ?? Number.NaN;

    if (!productId || !warehouseId || !Number.isFinite(quantity) || quantity <= 0) {
      showToast({ message: 'Product, warehouse, and quantity are required.', variant: 'error' });
      return;
    }

    try {
      await insertStockVoucherLineItems(voucherLineTarget.id, {
        items: [
          {
            product_id: productId,
            warehouse_id: warehouseId,
            quantity,
          },
        ],
      });

      showToast({ message: 'Voucher line item saved.', variant: 'success' });
      setVoucherLineVisible(false);
      setVoucherLineTarget(null);
      setVoucherLineValues(toStockVoucherLineItemFormValues());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Voucher line mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitSalesForm() {
    const transactionDate = salesFormValues.transactionDate || new Date().toISOString().slice(0, 10);

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
      const message = error instanceof Error ? error.message : 'Sales transaction mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitSalesLineForm() {
    if (!salesLinesTarget) return;

    const productId = salesLineFormValues.productId.trim();
    const warehouseId = salesLineFormValues.warehouseId.trim();
    const quantity = parseOptionalNumber(salesLineFormValues.quantity) ?? Number.NaN;
    const unitPrice = parseOptionalNumber(salesLineFormValues.unitPrice) ?? Number.NaN;
    const subtotal = parseOptionalNumber(salesLineFormValues.subtotal);

    if (
      !productId ||
      !warehouseId ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0
    ) {
      showToast({
        message: 'Product, warehouse, quantity, and unit price are required.',
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
          product_name: salesLineFormValues.productName.trim() || selectedProduct?.name || 'Product',
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
          product_name: salesLineFormValues.productName.trim() || selectedProduct?.name || 'Product',
          warehouse_id: warehouseId,
          quantity,
          unit_price: unitPrice,
          subtotal: subtotal ?? quantity * unitPrice,
        });

        showToast({ message: 'Sales line item updated.', variant: 'success' });
      }

      setSalesLineFormVisible(false);
      setSalesLineFormMode('create');
      setEditingSalesLine(null);
      setSalesLineFormValues(toSalesTransactionLineFormValues());
      await refreshSalesLines();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sales line mutation failed.';
      showToast({ message, variant: 'error' });
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
      const message = error instanceof Error ? error.message : 'Action failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmTarget(null);
    }
  }

  function getActionSheetActions(): ActionSheetAction[] {
    if (!actionTarget) return [];

    if (actionTarget.type === 'order') {
      return [
        {
          key: 'view-order-details',
          label: 'View details',
          onPress: () => {
            void openOrderDetails(actionTarget.item);
            setActionTarget(null);
          },
        },
        {
          key: 'edit-order',
          label: 'Edit order',
          onPress: () => {
            openEditOrderSheet(actionTarget.item);
            setActionTarget(null);
          },
        },
        {
          key: 'validate-order-inventory',
          label: 'Validate inventory',
          onPress: () => {
            void loadOrderDetails(actionTarget.item.id)
              .then((details) => {
                const items = toInventoryItems(details.items);
                if (items.length === 0) {
                  throw new Error('Order has no valid product line items for inventory validation.');
                }
                return validateOrderInventory({ items });
              })
              .then(() => showToast({ message: 'Inventory validation succeeded.', variant: 'success' }))
              .catch((error) =>
                showToast({
                  message: error instanceof Error ? error.message : 'Inventory validation failed.',
                  variant: 'error',
                }),
              );
            setActionTarget(null);
          },
        },
        {
          key: 'allocate-order-inventory',
          label: 'Allocate inventory',
          onPress: () => {
            void loadOrderDetails(actionTarget.item.id)
              .then((details) => {
                const items = toInventoryItems(details.items);
                if (items.length === 0) {
                  throw new Error('Order has no valid product line items for allocation.');
                }
                return allocateOrderInventory({ items });
              })
              .then(() => showToast({ message: 'Inventory allocation succeeded.', variant: 'success' }))
              .catch((error) =>
                showToast({
                  message: error instanceof Error ? error.message : 'Inventory allocation failed.',
                  variant: 'error',
                }),
              );
            setActionTarget(null);
          },
        },
        {
          key: 'confirm-order',
          label: 'Confirm order',
          onPress: () => {
            void confirmOrder(actionTarget.item.id, { note: 'Confirmed from mobile Phase 10' })
              .then(() => showToast({ message: 'Order confirmed.', variant: 'success' }))
              .catch((error) =>
                showToast({
                  message: error instanceof Error ? error.message : 'Order confirmation failed.',
                  variant: 'error',
                }),
              );
            setActionTarget(null);
          },
        },
        {
          key: 'update-order-status',
          label: 'Update status',
          onPress: () => {
            openOrderStatusSheet(actionTarget.item);
            setActionTarget(null);
          },
        },
        {
          key: 'mark-order-read',
          label: 'Mark as read',
          onPress: () => {
            void markOrderAsRead(actionTarget.item.id)
              .then(() => showToast({ message: 'Order marked as read.', variant: 'success' }))
              .catch((error) =>
                showToast({
                  message: error instanceof Error ? error.message : 'Mark as read failed.',
                  variant: 'error',
                }),
              );
            setActionTarget(null);
          },
        },
        {
          key: 'create-order-stock-out',
          label: 'Create stock-out',
          onPress: () => {
            void createStockOutForOrder(actionTarget.item.id)
              .then(() => showToast({ message: 'Stock-out ensured for order.', variant: 'success' }))
              .catch((error) =>
                showToast({
                  message: error instanceof Error ? error.message : 'Create stock-out failed.',
                  variant: 'error',
                }),
              );
            setActionTarget(null);
          },
        },
        {
          key: 'delete-order',
          label: 'Delete order',
          destructive: true,
          onPress: () => {
            setConfirmTarget({ type: 'order-delete', item: actionTarget.item });
            setActionTarget(null);
          },
        },
      ];
    }

    if (actionTarget.type === 'voucher') {
      return [
        {
          key: 'edit-voucher',
          label: 'Edit voucher',
          onPress: () => {
            openEditVoucherSheet(actionTarget.item);
            setActionTarget(null);
          },
        },
        {
          key: 'post-voucher',
          label: 'Mark as posted',
          onPress: () => {
            void updateStockVoucherStatus(actionTarget.item.id, { status: 'posted' })
              .then(() => showToast({ message: 'Voucher status updated.', variant: 'success' }))
              .catch((error) =>
                showToast({
                  message: error instanceof Error ? error.message : 'Status update failed.',
                  variant: 'error',
                }),
              );
            setActionTarget(null);
          },
        },
        {
          key: 'add-voucher-line',
          label: 'Add line item',
          onPress: () => {
            setVoucherLineTarget(actionTarget.item);
            setVoucherLineValues(toStockVoucherLineItemFormValues());
            setVoucherLineVisible(true);
            setActionTarget(null);
          },
        },
        {
          key: 'delete-voucher-lines',
          label: 'Delete line items',
          destructive: true,
          onPress: () => {
            setConfirmTarget({ type: 'voucher-delete-lines', item: actionTarget.item });
            setActionTarget(null);
          },
        },
        {
          key: 'delete-voucher',
          label: 'Delete voucher',
          destructive: true,
          onPress: () => {
            setConfirmTarget({ type: 'voucher-delete', item: actionTarget.item });
            setActionTarget(null);
          },
        },
      ];
    }

    if (actionTarget.type === 'sales') {
      return [
        {
          key: 'manage-sales-lines',
          label: 'Manage lines',
          onPress: () => {
            void openSalesLines(actionTarget.item);
            setActionTarget(null);
          },
        },
        {
          key: 'edit-sales-transaction',
          label: 'Edit transaction',
          onPress: () => {
            openEditSalesSheet(actionTarget.item);
            setActionTarget(null);
          },
        },
        {
          key: 'complete-sales-transaction',
          label: 'Complete transaction',
          onPress: () => {
            setConfirmTarget({ type: 'sales-complete', item: actionTarget.item });
            setActionTarget(null);
          },
        },
      ];
    }

    return [
      {
        key: 'edit-sales-line',
        label: 'Edit line',
        onPress: () => {
          setSalesLineFormMode('edit');
          setEditingSalesLine(actionTarget.item);
          setSalesLineFormValues({
            productId: actionTarget.item.productId ?? '',
            productName: actionTarget.item.productName,
            warehouseId: actionTarget.item.warehouseId ?? '',
            quantity: actionTarget.item.quantity.toString(),
            unitPrice: actionTarget.item.unitPrice.toString(),
            subtotal: actionTarget.item.subtotal.toString(),
          });
          setSalesLineFormVisible(true);
          setActionTarget(null);
        },
      },
      {
        key: 'delete-sales-line',
        label: 'Delete line',
        destructive: true,
        onPress: () => {
          setConfirmTarget({ type: 'sales-line-delete', item: actionTarget.item });
          setActionTarget(null);
        },
      },
    ];
  }

  const ordersCount = filteredOrders.length;
  const stockCount = filteredVouchers.length;
  const salesCount = filteredSales.length;

  const activeRowsCount =
    activeTab === 'orders' ? ordersCount : activeTab === 'stock' ? stockCount : salesCount;

  const actionSheetActions = getActionSheetActions();

  return (
    <AppScreen scroll>
      <AppHeader
        title="Orders, Stock, and Sales"
        subtitle="Phase 10 operations flows using generated OpenAPI contracts (storefront deferred)."
      />

      <AppCard>
        <AppSection
          title="Store operations metrics"
          description={
            farmContext
              ? `${farmContext.name} (${farmContext.subscriptionStatus ?? 'n/a'})`
              : 'Farm context from orders module.'
          }
        >
          <View style={styles.metricsRow}>
            <MetricBadge label="Unread Orders" value={unreadOrderCount} variant="warning" />
            <MetricBadge label="Stock Vouchers" value={stockVouchers.length} variant="neutral" />
            <MetricBadge label="Sales Transactions" value={salesTransactions.length} variant="accent" />
            <MetricBadge label="Inventory Rows" value={productInventory.length} variant="success" />
          </View>
        </AppSection>
      </AppCard>

      <AppTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Phase10Tab)}
        tabs={PHASE10_TAB_OPTIONS.map((tab) => ({ label: tab.label, value: tab.value }))}
      />

      <TopActions
        createLabel={`Create ${toEntityLabel(activeTab)}`}
        onCreate={openCreateSheet}
        onRefresh={() => void refresh()}
        loading={isRefreshing || isMutating}
      />

      <AppCard>
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder={`Search ${activeTab}`}
        />
      </AppCard>

      <AppCard>
        <AppSection
          title={`${toEntityLabel(activeTab)} records`}
          description={
            activeTab === 'orders'
              ? 'Unread list + detail/status/confirm/create-stock-out workflows.'
              : activeTab === 'stock'
                ? 'Stock voucher + line-item flows for stock adjustment.'
                : 'Sales transactions + line items + complete command.'
          }
        >
          {isLoading ? (
            <>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </>
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
            <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
              <View style={styles.rows}>
                {activeTab === 'orders'
                  ? filteredOrders.map((order) => (
                      <AppCard key={order.id}>
                        <AppListItem
                          title={order.orderNumber}
                          description={
                            order.customerName
                              ? `${order.customerName} • ${money(order.totalAmount)} USD`
                              : `${money(order.totalAmount)} USD`
                          }
                          leftIcon="clipboard-list"
                          onPress={() => setActionTarget({ type: 'order', item: order })}
                        />
                        <View style={styles.rowMeta}>
                          <MetaBadge label="Status" value={order.status} variant={statusBadgeVariant(order.status)} />
                          <MetaBadge label="Items" value={order.itemsCount} variant="neutral" />
                          <MetaBadge
                            label="Read"
                            value={order.readAt ? 'Read' : 'Unread'}
                            variant={order.readAt ? 'neutral' : 'warning'}
                          />
                        </View>
                      </AppCard>
                    ))
                  : null}

                {activeTab === 'stock'
                  ? filteredVouchers.map((voucher) => (
                      <AppCard key={voucher.id}>
                        <AppListItem
                          title={voucher.voucherReference || voucher.id.slice(0, 8)}
                          description={`${voucher.type.toUpperCase()} • ${voucher.voucherDate ?? 'No date'}`}
                          leftIcon="warehouse"
                          onPress={() => setActionTarget({ type: 'voucher', item: voucher })}
                        />
                        <View style={styles.rowMeta}>
                          <MetaBadge
                            label="Status"
                            value={voucher.status}
                            variant={statusBadgeVariant(voucher.status)}
                          />
                          <MetaBadge label="Line items" value={voucher.lineItemsCount} variant="neutral" />
                        </View>
                      </AppCard>
                    ))
                  : null}

                {activeTab === 'sales'
                  ? filteredSales.map((transaction) => (
                      <AppCard key={transaction.id}>
                        <AppListItem
                          title={transaction.id.slice(0, 12)}
                          description={`${transaction.transactionDate ?? 'No date'} • ${money(
                            transaction.totalAmount,
                          )} USD`}
                          leftIcon="cash-multiple"
                          onPress={() => setActionTarget({ type: 'sales', item: transaction })}
                        />
                        <View style={styles.rowMeta}>
                          <MetaBadge
                            label="Status"
                            value={transaction.status}
                            variant={statusBadgeVariant(transaction.status)}
                          />
                          <MetaBadge
                            label="Price type"
                            value={transaction.priceType ?? 'n/a'}
                            variant="neutral"
                          />
                        </View>
                      </AppCard>
                    ))
                  : null}
              </View>
            </PullToRefreshContainer>
          )}
        </AppSection>
      </AppCard>

      <PaginationFooter
        page={1}
        pageSize={Math.max(activeRowsCount, 1)}
        totalItems={activeRowsCount}
        onPageChange={() => undefined}
      />

      <BottomSheet
        visible={orderFormVisible}
        onDismiss={closeOrderForm}
        title={orderFormMode === 'create' ? 'Create Order' : 'Edit Order'}
        footer={
          <SheetFooter
            onCancel={closeOrderForm}
            onSubmit={() => void submitOrderForm()}
            submitLabel={orderFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormField label="Status">
          <AppSelect
            value={orderFormValues.status}
            onChange={(value) => setOrderFormValues((prev) => ({ ...prev, status: value }))}
            options={ORDER_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>
        <FormField label="Order date">
          <AppDatePicker
            value={orderFormValues.orderDate || null}
            onChange={(value) => setOrderFormValues((prev) => ({ ...prev, orderDate: value ?? '' }))}
            placeholder="Select order date"
          />
        </FormField>
        <FormField label="Delivery date">
          <AppDatePicker
            value={orderFormValues.deliveryDate || null}
            onChange={(value) => setOrderFormValues((prev) => ({ ...prev, deliveryDate: value ?? '' }))}
            placeholder="Optional delivery date"
          />
        </FormField>
        <FormField label="Contact">
          <AppSelect
            value={orderFormValues.contactId || '__none__'}
            onChange={(value) =>
              setOrderFormValues((prev) => ({ ...prev, contactId: value === '__none__' ? '' : value }))
            }
            options={[{ label: 'No contact', value: '__none__' }, ...contactOptions]}
          />
        </FormField>
        <FormField label="Customer name">
          <AppInput
            value={orderFormValues.customerName}
            onChangeText={(value) => setOrderFormValues((prev) => ({ ...prev, customerName: value }))}
            placeholder="Optional customer name"
          />
        </FormField>
        <FormField label="Payment method">
          <AppInput
            value={orderFormValues.paymentMethod}
            onChangeText={(value) => setOrderFormValues((prev) => ({ ...prev, paymentMethod: value }))}
            placeholder="cash, card, transfer"
          />
        </FormField>
        {orderFormMode === 'create' ? (
          <>
            <FormField label="Product" required>
              <AppSelect
                value={orderFormValues.productId || '__none__'}
                onChange={(value) =>
                  setOrderFormValues((prev) => ({ ...prev, productId: value === '__none__' ? '' : value }))
                }
                options={[{ label: 'Select product', value: '__none__' }, ...productOptions]}
              />
            </FormField>
            <FormField label="Quantity" required>
              <AppInput
                value={orderFormValues.quantity}
                onChangeText={(value) => setOrderFormValues((prev) => ({ ...prev, quantity: value }))}
                placeholder="1"
              />
            </FormField>
            <FormField label="Unit price" required>
              <AppInput
                value={orderFormValues.unitPrice}
                onChangeText={(value) => setOrderFormValues((prev) => ({ ...prev, unitPrice: value }))}
                placeholder="1.00"
              />
            </FormField>
          </>
        ) : null}
        <FormField label="Notes">
          <AppTextArea
            value={orderFormValues.notes}
            onChangeText={(value) => setOrderFormValues((prev) => ({ ...prev, notes: value }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={orderStatusVisible}
        onDismiss={() => {
          setOrderStatusVisible(false);
          setOrderStatusTarget(null);
        }}
        title="Update Order Status"
        footer={
          <SheetFooter
            onCancel={() => {
              setOrderStatusVisible(false);
              setOrderStatusTarget(null);
            }}
            onSubmit={() => void submitOrderStatusForm()}
            submitLabel="Save"
            loading={isMutating}
            disabled={isMutating || !orderStatusTarget}
          />
        }
      >
        <FormField label="Status">
          <AppSelect
            value={orderStatusValues.status}
            onChange={(value) => setOrderStatusValues({ status: value })}
            options={ORDER_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>
      </BottomSheet>

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
          <>
            <Skeleton height={56} />
            <Skeleton height={56} />
          </>
        ) : orderDetailsError ? (
          <ErrorState message={orderDetailsError} onRetry={() => orderDetailsOrder && void openOrderDetails(orderDetailsOrder)} />
        ) : orderDetailsOrder ? (
          <>
            <AppListItem
              title={orderDetailsOrder.orderNumber}
              description={`${orderDetailsOrder.status} • ${money(orderDetailsOrder.totalAmount)} USD`}
              leftIcon="clipboard-text"
            />
            <View style={styles.rowMeta}>
              <MetaBadge label="Stock-out" value={orderDetailsStockOut ? 'Yes' : 'No'} variant={orderDetailsStockOut ? 'success' : 'warning'} />
              <MetaBadge label="Items" value={orderDetailsItems.length} variant="neutral" />
            </View>
            {orderDetailsItems.length === 0 ? (
              <EmptyState title="No order items" message="This order has no line items." />
            ) : (
              orderDetailsItems.map((item) => (
                <AppListItem
                  key={item.id}
                  title={item.productName}
                  description={`Qty ${item.quantity} • Unit ${money(item.unitPrice)} • Total ${money(
                    item.totalPrice,
                  )}`}
                  leftIcon="package-variant"
                />
              ))
            )}
          </>
        ) : (
          <EmptyState title="No details" message="Select an order to view details." />
        )}
      </BottomSheet>

      <BottomSheet
        visible={voucherFormVisible}
        onDismiss={closeVoucherForm}
        title={voucherFormMode === 'create' ? 'Create Stock Voucher' : 'Edit Stock Voucher'}
        footer={
          <SheetFooter
            onCancel={closeVoucherForm}
            onSubmit={() => void submitVoucherForm()}
            submitLabel={voucherFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormField label="Type" required>
          <AppSelect
            value={voucherFormValues.type}
            onChange={(value) => setVoucherFormValues((prev) => ({ ...prev, type: value }))}
            options={STOCK_VOUCHER_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>
        <FormField label="Status">
          <AppSelect
            value={voucherFormValues.status}
            onChange={(value) => setVoucherFormValues((prev) => ({ ...prev, status: value }))}
            options={STOCK_VOUCHER_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>
        <FormField label="Voucher date">
          <AppDatePicker
            value={voucherFormValues.voucherDate || null}
            onChange={(value) => setVoucherFormValues((prev) => ({ ...prev, voucherDate: value ?? '' }))}
            placeholder="Select voucher date"
          />
        </FormField>
        <FormField label="Contact">
          <AppSelect
            value={voucherFormValues.contactId || '__none__'}
            onChange={(value) =>
              setVoucherFormValues((prev) => ({ ...prev, contactId: value === '__none__' ? '' : value }))
            }
            options={[{ label: 'No contact', value: '__none__' }, ...contactOptions]}
          />
        </FormField>
        <FormField label="Reference">
          <AppInput
            value={voucherFormValues.voucherReference}
            onChangeText={(value) =>
              setVoucherFormValues((prev) => ({ ...prev, voucherReference: value }))
            }
            placeholder="Optional reference"
          />
        </FormField>
        <FormField label="Source type">
          <AppInput
            value={voucherFormValues.sourceType}
            onChangeText={(value) => setVoucherFormValues((prev) => ({ ...prev, sourceType: value }))}
            placeholder="manual_adjustment"
          />
        </FormField>
        <FormField label="Notes">
          <AppTextArea
            value={voucherFormValues.notes}
            onChangeText={(value) => setVoucherFormValues((prev) => ({ ...prev, notes: value }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={voucherLineVisible}
        onDismiss={() => {
          setVoucherLineVisible(false);
          setVoucherLineTarget(null);
          setVoucherLineValues(toStockVoucherLineItemFormValues());
        }}
        title="Add Voucher Line Item"
        footer={
          <SheetFooter
            onCancel={() => {
              setVoucherLineVisible(false);
              setVoucherLineTarget(null);
            }}
            onSubmit={() => void submitVoucherLineForm()}
            submitLabel="Save"
            loading={isMutating}
            disabled={isMutating || !voucherLineTarget}
          />
        }
      >
        <FormField label="Product" required>
          <AppSelect
            value={voucherLineValues.productId || '__none__'}
            onChange={(value) =>
              setVoucherLineValues((prev) => ({ ...prev, productId: value === '__none__' ? '' : value }))
            }
            options={[{ label: 'Select product', value: '__none__' }, ...productOptions]}
          />
        </FormField>
        <FormField label="Warehouse" required>
          <AppSelect
            value={voucherLineValues.warehouseId || '__none__'}
            onChange={(value) =>
              setVoucherLineValues((prev) => ({ ...prev, warehouseId: value === '__none__' ? '' : value }))
            }
            options={[{ label: 'Select warehouse', value: '__none__' }, ...warehouseOptions]}
          />
        </FormField>
        <FormField label="Quantity" required>
          <AppInput
            value={voucherLineValues.quantity}
            onChangeText={(value) => setVoucherLineValues((prev) => ({ ...prev, quantity: value }))}
            placeholder="1"
          />
        </FormField>
        <FormField label="Batch number">
          <AppInput
            value={voucherLineValues.batchNumber}
            onChangeText={(value) => setVoucherLineValues((prev) => ({ ...prev, batchNumber: value }))}
            placeholder="Optional batch"
          />
        </FormField>
        <FormField label="Manufacturing date">
          <AppDatePicker
            value={voucherLineValues.manufacturingDate || null}
            onChange={(value) =>
              setVoucherLineValues((prev) => ({ ...prev, manufacturingDate: value ?? '' }))
            }
            placeholder="Optional date"
          />
        </FormField>
        <FormField label="Expiry date">
          <AppDatePicker
            value={voucherLineValues.expiryDate || null}
            onChange={(value) => setVoucherLineValues((prev) => ({ ...prev, expiryDate: value ?? '' }))}
            placeholder="Optional date"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={salesFormVisible}
        onDismiss={closeSalesForm}
        title={salesFormMode === 'create' ? 'Create Sales Transaction' : 'Edit Sales Transaction'}
        footer={
          <SheetFooter
            onCancel={closeSalesForm}
            onSubmit={() => void submitSalesForm()}
            submitLabel={salesFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormField label="Status">
          <AppSelect
            value={salesFormValues.status}
            onChange={(value) => setSalesFormValues((prev) => ({ ...prev, status: value }))}
            options={SALES_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>
        <FormField label="Transaction date">
          <AppDatePicker
            value={salesFormValues.transactionDate || null}
            onChange={(value) => setSalesFormValues((prev) => ({ ...prev, transactionDate: value ?? '' }))}
            placeholder="Select transaction date"
          />
        </FormField>
        <FormField label="Price type">
          <AppSelect
            value={salesFormValues.priceType}
            onChange={(value) => setSalesFormValues((prev) => ({ ...prev, priceType: value }))}
            options={SALES_PRICE_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>
        <FormField label="Contact">
          <AppSelect
            value={salesFormValues.contactId || '__none__'}
            onChange={(value) =>
              setSalesFormValues((prev) => ({ ...prev, contactId: value === '__none__' ? '' : value }))
            }
            options={[{ label: 'No contact', value: '__none__' }, ...contactOptions]}
          />
        </FormField>
        <FormField label="Subtotal">
          <AppInput
            value={salesFormValues.subtotal}
            onChangeText={(value) => setSalesFormValues((prev) => ({ ...prev, subtotal: value }))}
            placeholder="Optional subtotal"
          />
        </FormField>
        <FormField label="Tax amount">
          <AppInput
            value={salesFormValues.taxAmount}
            onChangeText={(value) => setSalesFormValues((prev) => ({ ...prev, taxAmount: value }))}
            placeholder="Optional tax"
          />
        </FormField>
        <FormField label="Total amount">
          <AppInput
            value={salesFormValues.totalAmount}
            onChangeText={(value) => setSalesFormValues((prev) => ({ ...prev, totalAmount: value }))}
            placeholder="Optional total"
          />
        </FormField>
        <FormField label="Affects income">
          <AppSelect
            value={salesFormValues.affectsIncome}
            onChange={(value) =>
              setSalesFormValues((prev) => ({ ...prev, affectsIncome: value === 'yes' ? 'yes' : 'no' }))
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
            onChangeText={(value) => setSalesFormValues((prev) => ({ ...prev, notes: value }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={salesLinesVisible}
        onDismiss={() => {
          setSalesLinesVisible(false);
          setSalesLinesTarget(null);
          setSalesLinesRows([]);
          setSalesLinesError(null);
          setSalesLineFormVisible(false);
          setEditingSalesLine(null);
          setSalesLineFormValues(toSalesTransactionLineFormValues());
          setActionTarget(null);
        }}
        title="Sales Transaction Lines"
        footer={
          <SheetFooter
            onCancel={() => {
              setSalesLinesVisible(false);
              setSalesLinesTarget(null);
            }}
            onSubmit={() => {
              setSalesLineFormMode('create');
              setEditingSalesLine(null);
              setSalesLineFormValues(toSalesTransactionLineFormValues());
              setSalesLineFormVisible(true);
            }}
            submitLabel="Add line"
            loading={false}
            disabled={!salesLinesTarget}
          />
        }
      >
        {salesLinesTarget ? (
          <AppListItem
            title={salesLinesTarget.id.slice(0, 12)}
            description={`${salesLinesTarget.status} • ${money(salesLinesTarget.totalAmount)} USD`}
            leftIcon="receipt"
          />
        ) : null}

        {salesLinesLoading ? (
          <>
            <Skeleton height={56} />
            <Skeleton height={56} />
          </>
        ) : salesLinesError ? (
          <ErrorState message={salesLinesError} onRetry={() => void refreshSalesLines()} />
        ) : salesLinesRows.length === 0 ? (
          <EmptyState title="No lines" message="Add line items for this transaction." />
        ) : (
          <View style={styles.rows}>
            {salesLinesRows.map((line) => (
              <AppCard key={line.id}>
                <AppListItem
                  title={line.productName}
                  description={`Qty ${line.quantity} • Unit ${money(line.unitPrice)} • Subtotal ${money(
                    line.subtotal,
                  )}`}
                  leftIcon="barcode"
                  onPress={() => setActionTarget({ type: 'sales-line', item: line })}
                />
              </AppCard>
            ))}
          </View>
        )}
      </BottomSheet>

      <BottomSheet
        visible={salesLineFormVisible}
        onDismiss={() => {
          setSalesLineFormVisible(false);
          setSalesLineFormMode('create');
          setEditingSalesLine(null);
          setSalesLineFormValues(toSalesTransactionLineFormValues());
        }}
        title={salesLineFormMode === 'create' ? 'Add Sales Line' : 'Edit Sales Line'}
        footer={
          <SheetFooter
            onCancel={() => {
              setSalesLineFormVisible(false);
              setSalesLineFormMode('create');
              setEditingSalesLine(null);
            }}
            onSubmit={() => void submitSalesLineForm()}
            submitLabel={salesLineFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating || !salesLinesTarget}
          />
        }
      >
        <FormField label="Product" required>
          <AppSelect
            value={salesLineFormValues.productId || '__none__'}
            onChange={(value) =>
              setSalesLineFormValues((prev) => ({ ...prev, productId: value === '__none__' ? '' : value }))
            }
            options={[{ label: 'Select product', value: '__none__' }, ...productOptions]}
          />
        </FormField>
        <FormField label="Product name">
          <AppInput
            value={salesLineFormValues.productName}
            onChangeText={(value) => setSalesLineFormValues((prev) => ({ ...prev, productName: value }))}
            placeholder="Optional override"
          />
        </FormField>
        <FormField label="Warehouse">
          <AppSelect
            value={salesLineFormValues.warehouseId || '__none__'}
            onChange={(value) =>
              setSalesLineFormValues((prev) => ({ ...prev, warehouseId: value === '__none__' ? '' : value }))
            }
            options={[{ label: 'No warehouse', value: '__none__' }, ...warehouseOptions]}
          />
        </FormField>
        <FormField label="Quantity" required>
          <AppInput
            value={salesLineFormValues.quantity}
            onChangeText={(value) => setSalesLineFormValues((prev) => ({ ...prev, quantity: value }))}
            placeholder="1"
          />
        </FormField>
        <FormField label="Unit price" required>
          <AppInput
            value={salesLineFormValues.unitPrice}
            onChangeText={(value) => setSalesLineFormValues((prev) => ({ ...prev, unitPrice: value }))}
            placeholder="1.00"
          />
        </FormField>
        <FormField label="Subtotal">
          <AppInput
            value={salesLineFormValues.subtotal}
            onChangeText={(value) => setSalesLineFormValues((prev) => ({ ...prev, subtotal: value }))}
            placeholder="Optional subtotal"
          />
        </FormField>
      </BottomSheet>

      <ActionSheet
        visible={Boolean(actionTarget) && !confirmTarget}
        onDismiss={() => setActionTarget(null)}
        title={
          actionTarget?.type === 'order'
            ? actionTarget.item.orderNumber
            : actionTarget?.type === 'voucher'
              ? actionTarget.item.voucherReference || actionTarget.item.id.slice(0, 8)
              : actionTarget?.type === 'sales'
                ? actionTarget.item.id.slice(0, 12)
                : actionTarget?.type === 'sales-line'
                  ? actionTarget.item.productName
                  : undefined
        }
        message="Select an action"
        actions={actionSheetActions}
      />

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
        confirmLabel={
          confirmTarget?.type === 'sales-complete' ? 'Complete' : 'Confirm'
        }
        confirmTone={confirmTarget?.type === 'sales-complete' ? 'primary' : 'destructive'}
        confirmLoading={isMutating}
        confirmDisabled={isMutating}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => void submitConfirmAction()}
      />
    </AppScreen>
  );
}

function MetricBadge({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant: 'neutral' | 'accent' | 'success' | 'warning';
}) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricLabel}>{label}</Text>
      <AppBadge value={value} variant={variant} />
    </View>
  );
}

function MetaBadge({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant: 'neutral' | 'accent' | 'success' | 'warning' | 'destructive';
}) {
  return (
    <View style={styles.metaGroup}>
      <Text style={styles.metaText}>{label}</Text>
      <AppBadge value={value} variant={variant} />
    </View>
  );
}

function TopActions({
  createLabel,
  onCreate,
  onRefresh,
  loading,
}: {
  createLabel: string;
  onCreate: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.topActions}>
      <View style={styles.primaryAction}>
        <AppButton label={createLabel} onPress={onCreate} disabled={loading} />
      </View>
      <View style={styles.secondaryAction}>
        <AppButton
          label="Refresh"
          mode="outlined"
          tone="neutral"
          onPress={onRefresh}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
}

function SheetFooter({
  onCancel,
  onSubmit,
  submitLabel,
  loading,
  disabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <View style={styles.sheetFooter}>
      <AppButton label="Cancel" mode="text" tone="neutral" onPress={onCancel} disabled={loading} />
      <AppButton label={submitLabel} onPress={onSubmit} loading={loading} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    minWidth: 132,
  },
  rows: {
    gap: spacing.sm,
  },
  rowMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
    alignItems: 'center',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
