import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  allocateOrderInventory,
  completeSalesTransaction,
  confirmOrder,
  createInventoryRecord,
  createOrder,
  createSalesTransaction,
  createSalesTransactionLine,
  createStockOutForOrder,
  createStockVoucher,
  deleteInventoryRecord,
  deleteOrder,
  deleteSalesTransactionLine,
  deleteStockVoucher,
  deleteStockVoucherLineItems,
  findInventoryEntry,
  getOrderDetails,
  getOrderItems,
  getOrdersFarmContext,
  getSalesTransactionById,
  getUnreadOrdersCount,
  hasOrderStockOut,
  insertStockVoucherLineItems,
  listInventoryQuantities,
  listProductInventory,
  listProductInventoryRows,
  listSalesTransactionLines,
  listSalesTransactions,
  listStockAdjustmentContacts,
  listStockAdjustmentProducts,
  listStockAdjustmentWarehouses,
  listStockVouchers,
  listUnreadOrders,
  markOrderAsRead,
  updateInventoryQuantity,
  updateInventoryRecord,
  updateOrder,
  updateOrderStatus,
  updateSalesTransaction,
  updateSalesTransactionLine,
  updateStockVoucher,
  updateStockVoucherStatus,
  validateOrderInventory,
  type AllocateInventoryRequest,
  type ConfirmOrderRequest,
  type CreateInventoryRecordRequest,
  type CreateOrderRequest,
  type CreateSalesTransactionLineRequest,
  type CreateSalesTransactionRequest,
  type CreateStockVoucherRequest,
  type FindInventoryEntryRequest,
  type InsertVoucherLineItemsRequest,
  type InventoryQuantitiesLookupRequest,
  type ProductInventoryRowsLookupRequest,
  type UpdateInventoryQuantityRequest,
  type UpdateInventoryRecordRequest,
  type UpdateOrderRequest,
  type UpdateOrderStatusRequest,
  type UpdateSalesTransactionLineRequest,
  type UpdateSalesTransactionRequest,
  type UpdateStockVoucherRequest,
  type UpdateStockVoucherStatusRequest,
  type ValidateInventoryRequest,
} from '../../api/modules/orders';
import { useAuthSession } from '../../hooks/useAuthSession';

const PHASE10_QUERY_KEY = ['phase10'] as const;
const ORDERS_FARM_CONTEXT_QUERY_KEY = ['phase10', 'orders', 'farm-context'] as const;
const ORDERS_UNREAD_COUNT_QUERY_KEY = ['phase10', 'orders', 'unread-count'] as const;
const ORDERS_UNREAD_QUERY_KEY = ['phase10', 'orders', 'unread'] as const;
const STOCK_VOUCHERS_QUERY_KEY = ['phase10', 'stock', 'vouchers'] as const;
const STOCK_PRODUCTS_QUERY_KEY = ['phase10', 'stock', 'products'] as const;
const STOCK_CONTACTS_QUERY_KEY = ['phase10', 'stock', 'contacts'] as const;
const STOCK_WAREHOUSES_QUERY_KEY = ['phase10', 'stock', 'warehouses'] as const;
const STOCK_PRODUCT_INVENTORY_QUERY_KEY = ['phase10', 'stock', 'product-inventory'] as const;
const SALES_TRANSACTIONS_QUERY_KEY = ['phase10', 'sales', 'transactions'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useOrdersModule() {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const farmContextQuery = useQuery({
    queryKey: ORDERS_FARM_CONTEXT_QUERY_KEY,
    queryFn: () => getOrdersFarmContext(token ?? ''),
    enabled: Boolean(token),
  });

  const unreadCountQuery = useQuery({
    queryKey: ORDERS_UNREAD_COUNT_QUERY_KEY,
    queryFn: () => getUnreadOrdersCount(token ?? ''),
    enabled: Boolean(token),
  });

  const unreadOrdersQuery = useQuery({
    queryKey: ORDERS_UNREAD_QUERY_KEY,
    queryFn: () => listUnreadOrders(token ?? ''),
    enabled: Boolean(token),
  });

  const stockVouchersQuery = useQuery({
    queryKey: STOCK_VOUCHERS_QUERY_KEY,
    queryFn: () => listStockVouchers(token ?? ''),
    enabled: Boolean(token),
  });

  const stockProductsQuery = useQuery({
    queryKey: STOCK_PRODUCTS_QUERY_KEY,
    queryFn: () => listStockAdjustmentProducts(token ?? ''),
    enabled: Boolean(token),
  });

  const stockContactsQuery = useQuery({
    queryKey: STOCK_CONTACTS_QUERY_KEY,
    queryFn: () => listStockAdjustmentContacts(token ?? ''),
    enabled: Boolean(token),
  });

  const stockWarehousesQuery = useQuery({
    queryKey: STOCK_WAREHOUSES_QUERY_KEY,
    queryFn: () => listStockAdjustmentWarehouses(token ?? ''),
    enabled: Boolean(token),
  });

  const stockProductInventoryQuery = useQuery({
    queryKey: STOCK_PRODUCT_INVENTORY_QUERY_KEY,
    queryFn: () => listProductInventory(token ?? ''),
    enabled: Boolean(token),
  });

  const salesTransactionsQuery = useQuery({
    queryKey: SALES_TRANSACTIONS_QUERY_KEY,
    queryFn: () => listSalesTransactions(token ?? ''),
    enabled: Boolean(token),
  });

  async function invalidatePhase10Queries() {
    await queryClient.invalidateQueries({ queryKey: PHASE10_QUERY_KEY });
  }

  const createOrderMutation = useMutation({
    mutationFn: (input: CreateOrderRequest) => createOrder(token ?? '', input),
    onSuccess: invalidatePhase10Queries,
  });

  const confirmOrderMutation = useMutation({
    mutationFn: (payload: { orderId: string; input: ConfirmOrderRequest }) =>
      confirmOrder(token ?? '', payload.orderId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: (payload: { orderId: string; input: UpdateOrderStatusRequest }) =>
      updateOrderStatus(token ?? '', payload.orderId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const updateOrderMutation = useMutation({
    mutationFn: (payload: { orderId: string; input: UpdateOrderRequest }) =>
      updateOrder(token ?? '', payload.orderId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) => deleteOrder(token ?? '', orderId),
    onSuccess: invalidatePhase10Queries,
  });

  const markOrderReadMutation = useMutation({
    mutationFn: (orderId: string) => markOrderAsRead(token ?? '', orderId),
    onSuccess: invalidatePhase10Queries,
  });

  const createStockOutMutation = useMutation({
    mutationFn: (orderId: string) => createStockOutForOrder(token ?? '', orderId),
    onSuccess: invalidatePhase10Queries,
  });

  const validateInventoryMutation = useMutation({
    mutationFn: (input: ValidateInventoryRequest) => validateOrderInventory(token ?? '', input),
  });

  const allocateInventoryMutation = useMutation({
    mutationFn: (input: AllocateInventoryRequest) => allocateOrderInventory(token ?? '', input),
  });

  const createStockVoucherMutation = useMutation({
    mutationFn: (input: CreateStockVoucherRequest) => createStockVoucher(token ?? '', input),
    onSuccess: invalidatePhase10Queries,
  });

  const updateStockVoucherMutation = useMutation({
    mutationFn: (payload: { voucherId: string; input: UpdateStockVoucherRequest }) =>
      updateStockVoucher(token ?? '', payload.voucherId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const updateStockVoucherStatusMutation = useMutation({
    mutationFn: (payload: { voucherId: string; input: UpdateStockVoucherStatusRequest }) =>
      updateStockVoucherStatus(token ?? '', payload.voucherId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const deleteStockVoucherMutation = useMutation({
    mutationFn: (voucherId: string) => deleteStockVoucher(token ?? '', voucherId),
    onSuccess: invalidatePhase10Queries,
  });

  const insertVoucherLineItemsMutation = useMutation({
    mutationFn: (payload: { voucherId: string; input: InsertVoucherLineItemsRequest }) =>
      insertStockVoucherLineItems(token ?? '', payload.voucherId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const deleteVoucherLineItemsMutation = useMutation({
    mutationFn: (voucherId: string) => deleteStockVoucherLineItems(token ?? '', voucherId),
    onSuccess: invalidatePhase10Queries,
  });

  const createInventoryRecordMutation = useMutation({
    mutationFn: (input: CreateInventoryRecordRequest) => createInventoryRecord(token ?? '', input),
    onSuccess: invalidatePhase10Queries,
  });

  const updateInventoryRecordMutation = useMutation({
    mutationFn: (payload: { inventoryId: string; input: UpdateInventoryRecordRequest }) =>
      updateInventoryRecord(token ?? '', payload.inventoryId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const updateInventoryQuantityMutation = useMutation({
    mutationFn: (payload: { inventoryId: string; input: UpdateInventoryQuantityRequest }) =>
      updateInventoryQuantity(token ?? '', payload.inventoryId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const deleteInventoryRecordMutation = useMutation({
    mutationFn: (inventoryId: string) => deleteInventoryRecord(token ?? '', inventoryId),
    onSuccess: invalidatePhase10Queries,
  });

  const createSalesTransactionMutation = useMutation({
    mutationFn: (input: CreateSalesTransactionRequest) => createSalesTransaction(token ?? '', input),
    onSuccess: invalidatePhase10Queries,
  });

  const updateSalesTransactionMutation = useMutation({
    mutationFn: (payload: { transactionId: string; input: UpdateSalesTransactionRequest }) =>
      updateSalesTransaction(token ?? '', payload.transactionId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const completeSalesTransactionMutation = useMutation({
    mutationFn: (transactionId: string) => completeSalesTransaction(token ?? '', transactionId),
    onSuccess: invalidatePhase10Queries,
  });

  const createSalesTransactionLineMutation = useMutation({
    mutationFn: (payload: { transactionId: string; input: CreateSalesTransactionLineRequest }) =>
      createSalesTransactionLine(token ?? '', payload.transactionId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const updateSalesTransactionLineMutation = useMutation({
    mutationFn: (payload: { lineId: string; input: UpdateSalesTransactionLineRequest }) =>
      updateSalesTransactionLine(token ?? '', payload.lineId, payload.input),
    onSuccess: invalidatePhase10Queries,
  });

  const deleteSalesTransactionLineMutation = useMutation({
    mutationFn: (lineId: string) => deleteSalesTransactionLine(token ?? '', lineId),
    onSuccess: invalidatePhase10Queries,
  });

  const isMutating =
    createOrderMutation.isPending ||
    confirmOrderMutation.isPending ||
    updateOrderStatusMutation.isPending ||
    updateOrderMutation.isPending ||
    deleteOrderMutation.isPending ||
    markOrderReadMutation.isPending ||
    createStockOutMutation.isPending ||
    validateInventoryMutation.isPending ||
    allocateInventoryMutation.isPending ||
    createStockVoucherMutation.isPending ||
    updateStockVoucherMutation.isPending ||
    updateStockVoucherStatusMutation.isPending ||
    deleteStockVoucherMutation.isPending ||
    insertVoucherLineItemsMutation.isPending ||
    deleteVoucherLineItemsMutation.isPending ||
    createInventoryRecordMutation.isPending ||
    updateInventoryRecordMutation.isPending ||
    updateInventoryQuantityMutation.isPending ||
    deleteInventoryRecordMutation.isPending ||
    createSalesTransactionMutation.isPending ||
    updateSalesTransactionMutation.isPending ||
    completeSalesTransactionMutation.isPending ||
    createSalesTransactionLineMutation.isPending ||
    updateSalesTransactionLineMutation.isPending ||
    deleteSalesTransactionLineMutation.isPending;

  return {
    farmContext: farmContextQuery.data ?? null,
    unreadOrderCount: unreadCountQuery.data ?? 0,
    unreadOrders: useMemo(() => unreadOrdersQuery.data ?? [], [unreadOrdersQuery.data]),
    stockVouchers: useMemo(() => stockVouchersQuery.data ?? [], [stockVouchersQuery.data]),
    stockProducts: useMemo(() => stockProductsQuery.data ?? [], [stockProductsQuery.data]),
    stockContacts: useMemo(() => stockContactsQuery.data ?? [], [stockContactsQuery.data]),
    stockWarehouses: useMemo(() => stockWarehousesQuery.data ?? [], [stockWarehousesQuery.data]),
    productInventory: useMemo(
      () => stockProductInventoryQuery.data ?? [],
      [stockProductInventoryQuery.data],
    ),
    salesTransactions: useMemo(
      () => salesTransactionsQuery.data ?? [],
      [salesTransactionsQuery.data],
    ),
    isLoading:
      farmContextQuery.isLoading ||
      unreadCountQuery.isLoading ||
      unreadOrdersQuery.isLoading ||
      stockVouchersQuery.isLoading ||
      stockProductsQuery.isLoading ||
      stockContactsQuery.isLoading ||
      stockWarehousesQuery.isLoading ||
      stockProductInventoryQuery.isLoading ||
      salesTransactionsQuery.isLoading,
    isRefreshing:
      farmContextQuery.isFetching ||
      unreadCountQuery.isFetching ||
      unreadOrdersQuery.isFetching ||
      stockVouchersQuery.isFetching ||
      stockProductsQuery.isFetching ||
      stockContactsQuery.isFetching ||
      stockWarehousesQuery.isFetching ||
      stockProductInventoryQuery.isFetching ||
      salesTransactionsQuery.isFetching,
    isMutating,
    errorMessage: farmContextQuery.error
      ? toErrorMessage(farmContextQuery.error, 'Failed to load order context.')
      : unreadCountQuery.error
        ? toErrorMessage(unreadCountQuery.error, 'Failed to load unread order count.')
        : unreadOrdersQuery.error
          ? toErrorMessage(unreadOrdersQuery.error, 'Failed to load orders.')
          : stockVouchersQuery.error
            ? toErrorMessage(stockVouchersQuery.error, 'Failed to load stock vouchers.')
            : stockProductsQuery.error
              ? toErrorMessage(stockProductsQuery.error, 'Failed to load stock products.')
              : stockContactsQuery.error
                ? toErrorMessage(stockContactsQuery.error, 'Failed to load stock contacts.')
                : stockWarehousesQuery.error
                  ? toErrorMessage(stockWarehousesQuery.error, 'Failed to load stock warehouses.')
                  : stockProductInventoryQuery.error
                    ? toErrorMessage(
                        stockProductInventoryQuery.error,
                        'Failed to load product inventory.',
                      )
                    : salesTransactionsQuery.error
                      ? toErrorMessage(salesTransactionsQuery.error, 'Failed to load sales transactions.')
                      : null,
    refresh: async () => {
      await Promise.all([
        farmContextQuery.refetch(),
        unreadCountQuery.refetch(),
        unreadOrdersQuery.refetch(),
        stockVouchersQuery.refetch(),
        stockProductsQuery.refetch(),
        stockContactsQuery.refetch(),
        stockWarehousesQuery.refetch(),
        stockProductInventoryQuery.refetch(),
        salesTransactionsQuery.refetch(),
      ]);
    },
    createOrder: (input: CreateOrderRequest) => createOrderMutation.mutateAsync(input),
    confirmOrder: (orderId: string, input: ConfirmOrderRequest) =>
      confirmOrderMutation.mutateAsync({ orderId, input }),
    updateOrderStatus: (orderId: string, input: UpdateOrderStatusRequest) =>
      updateOrderStatusMutation.mutateAsync({ orderId, input }),
    updateOrder: (orderId: string, input: UpdateOrderRequest) =>
      updateOrderMutation.mutateAsync({ orderId, input }),
    deleteOrder: (orderId: string) => deleteOrderMutation.mutateAsync(orderId),
    markOrderAsRead: (orderId: string) => markOrderReadMutation.mutateAsync(orderId),
    createStockOutForOrder: (orderId: string) => createStockOutMutation.mutateAsync(orderId),
    validateOrderInventory: (input: ValidateInventoryRequest) =>
      validateInventoryMutation.mutateAsync(input),
    allocateOrderInventory: (input: AllocateInventoryRequest) =>
      allocateInventoryMutation.mutateAsync(input),
    createStockVoucher: (input: CreateStockVoucherRequest) =>
      createStockVoucherMutation.mutateAsync(input),
    updateStockVoucher: (voucherId: string, input: UpdateStockVoucherRequest) =>
      updateStockVoucherMutation.mutateAsync({ voucherId, input }),
    updateStockVoucherStatus: (voucherId: string, input: UpdateStockVoucherStatusRequest) =>
      updateStockVoucherStatusMutation.mutateAsync({ voucherId, input }),
    deleteStockVoucher: (voucherId: string) => deleteStockVoucherMutation.mutateAsync(voucherId),
    insertStockVoucherLineItems: (voucherId: string, input: InsertVoucherLineItemsRequest) =>
      insertVoucherLineItemsMutation.mutateAsync({ voucherId, input }),
    deleteStockVoucherLineItems: (voucherId: string) =>
      deleteVoucherLineItemsMutation.mutateAsync(voucherId),
    createInventoryRecord: (input: CreateInventoryRecordRequest) =>
      createInventoryRecordMutation.mutateAsync(input),
    updateInventoryRecord: (inventoryId: string, input: UpdateInventoryRecordRequest) =>
      updateInventoryRecordMutation.mutateAsync({ inventoryId, input }),
    updateInventoryQuantity: (inventoryId: string, input: UpdateInventoryQuantityRequest) =>
      updateInventoryQuantityMutation.mutateAsync({ inventoryId, input }),
    deleteInventoryRecord: (inventoryId: string) =>
      deleteInventoryRecordMutation.mutateAsync(inventoryId),
    createSalesTransaction: (input: CreateSalesTransactionRequest) =>
      createSalesTransactionMutation.mutateAsync(input),
    updateSalesTransaction: (transactionId: string, input: UpdateSalesTransactionRequest) =>
      updateSalesTransactionMutation.mutateAsync({ transactionId, input }),
    completeSalesTransaction: (transactionId: string) =>
      completeSalesTransactionMutation.mutateAsync(transactionId),
    createSalesTransactionLine: (transactionId: string, input: CreateSalesTransactionLineRequest) =>
      createSalesTransactionLineMutation.mutateAsync({ transactionId, input }),
    updateSalesTransactionLine: (lineId: string, input: UpdateSalesTransactionLineRequest) =>
      updateSalesTransactionLineMutation.mutateAsync({ lineId, input }),
    deleteSalesTransactionLine: (lineId: string) =>
      deleteSalesTransactionLineMutation.mutateAsync(lineId),
    loadOrderDetails: async (orderId: string) => {
      const [order, items, stockOut] = await Promise.all([
        getOrderDetails(token ?? '', orderId),
        getOrderItems(token ?? '', orderId),
        hasOrderStockOut(token ?? '', orderId),
      ]);
      return {
        order,
        items,
        stockOut,
      };
    },
    loadSalesTransaction: (transactionId: string) => getSalesTransactionById(token ?? '', transactionId),
    loadSalesTransactionLines: (transactionId: string) =>
      listSalesTransactionLines(token ?? '', transactionId),
    loadProductInventoryRows: (input: ProductInventoryRowsLookupRequest) =>
      listProductInventoryRows(token ?? '', input),
    loadInventoryQuantities: (input: InventoryQuantitiesLookupRequest) =>
      listInventoryQuantities(token ?? '', input),
    findInventoryEntry: (input: FindInventoryEntryRequest) => findInventoryEntry(token ?? '', input),
  };
}
