import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  createProduct,
  createTax,
  createWarehouse,
  hardDeleteProducts,
  listCategories,
  listProducts,
  listStockAdjustmentProducts,
  listTaxes,
  listWarehouses,
  updateCategory,
  updateProduct,
  updateTax,
  updateWarehouse,
  type CreateCategoryRequest,
  type CreateProductRequest,
  type CreateTaxRequest,
  type CreateWarehouseRequest,
  type HardDeleteProductsRequest,
  type InventoryCategory,
  type InventoryProduct,
  type InventoryTax,
  type InventoryWarehouse,
  type StockAdjustmentProduct,
  type UpdateCategoryRequest,
  type UpdateProductRequest,
  type UpdateTaxRequest,
  type UpdateWarehouseRequest,
} from '../../api/modules/inventory';
import { listFields } from '../../api/modules/fields';
import { useAuthSession } from '../../hooks/useAuthSession';

const CATEGORIES_QUERY_KEY = ['inventory', 'categories'] as const;
const TAXES_QUERY_KEY = ['inventory', 'taxes'] as const;
const WAREHOUSES_QUERY_KEY = ['inventory', 'warehouses'] as const;
const PRODUCTS_QUERY_KEY = ['inventory', 'products'] as const;
const STOCK_ADJUSTMENT_PRODUCTS_QUERY_KEY = ['inventory', 'stock-adjustment-products'] as const;
const FIELDS_OPTIONS_QUERY_KEY = ['inventory', 'fields-options'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useInventoryModule() {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => listCategories(token ?? '', { limit: 200, offset: 0, status: 'all' }),
    enabled: Boolean(token),
  });

  const taxesQuery = useQuery({
    queryKey: TAXES_QUERY_KEY,
    queryFn: () => listTaxes(token ?? '', { limit: 200, offset: 0, status: 'all' }),
    enabled: Boolean(token),
  });

  const warehousesQuery = useQuery({
    queryKey: WAREHOUSES_QUERY_KEY,
    queryFn: () => listWarehouses(token ?? '', { limit: 200, offset: 0, status: 'all' }),
    enabled: Boolean(token),
  });

  const productsQuery = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: () => listProducts(token ?? '', { limit: 200, offset: 0, status: 'all' }),
    enabled: Boolean(token),
  });

  const stockAdjustmentProductsQuery = useQuery({
    queryKey: STOCK_ADJUSTMENT_PRODUCTS_QUERY_KEY,
    queryFn: () => listStockAdjustmentProducts(token ?? ''),
    enabled: Boolean(token),
  });

  const fieldsOptionsQuery = useQuery({
    queryKey: FIELDS_OPTIONS_QUERY_KEY,
    queryFn: () => listFields(token ?? ''),
    enabled: Boolean(token),
  });

  async function invalidateCatalogQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: TAXES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_PRODUCTS_QUERY_KEY }),
    ]);
  }

  const createCategoryMutation = useMutation({
    mutationFn: (input: CreateCategoryRequest) => createCategory(token ?? '', input),
    onSuccess: invalidateCatalogQueries,
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (payload: { categoryId: string; input: UpdateCategoryRequest }) =>
      updateCategory(token ?? '', payload.categoryId, payload.input),
    onSuccess: invalidateCatalogQueries,
  });

  const createTaxMutation = useMutation({
    mutationFn: (input: CreateTaxRequest) => createTax(token ?? '', input),
    onSuccess: invalidateCatalogQueries,
  });

  const updateTaxMutation = useMutation({
    mutationFn: (payload: { taxId: string; input: UpdateTaxRequest }) =>
      updateTax(token ?? '', payload.taxId, payload.input),
    onSuccess: invalidateCatalogQueries,
  });

  const createWarehouseMutation = useMutation({
    mutationFn: (input: CreateWarehouseRequest) => createWarehouse(token ?? '', input),
    onSuccess: invalidateCatalogQueries,
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: (payload: { warehouseId: string; input: UpdateWarehouseRequest }) =>
      updateWarehouse(token ?? '', payload.warehouseId, payload.input),
    onSuccess: invalidateCatalogQueries,
  });

  const createProductMutation = useMutation({
    mutationFn: (input: CreateProductRequest) => createProduct(token ?? '', input),
    onSuccess: invalidateCatalogQueries,
  });

  const updateProductMutation = useMutation({
    mutationFn: (payload: { productId: string; input: UpdateProductRequest }) =>
      updateProduct(token ?? '', payload.productId, payload.input),
    onSuccess: invalidateCatalogQueries,
  });

  const hardDeleteProductsMutation = useMutation({
    mutationFn: (input: HardDeleteProductsRequest) => hardDeleteProducts(token ?? '', input),
    onSuccess: invalidateCatalogQueries,
  });

  const isMutating =
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    createTaxMutation.isPending ||
    updateTaxMutation.isPending ||
    createWarehouseMutation.isPending ||
    updateWarehouseMutation.isPending ||
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    hardDeleteProductsMutation.isPending;

  const categories = useMemo<InventoryCategory[]>(
    () => categoriesQuery.data?.items ?? [],
    [categoriesQuery.data?.items],
  );
  const taxes = useMemo<InventoryTax[]>(() => taxesQuery.data?.items ?? [], [taxesQuery.data?.items]);
  const warehouses = useMemo<InventoryWarehouse[]>(
    () => warehousesQuery.data?.items ?? [],
    [warehousesQuery.data?.items],
  );
  const products = useMemo<InventoryProduct[]>(
    () => productsQuery.data?.items ?? [],
    [productsQuery.data?.items],
  );
  const stockAdjustmentProducts = useMemo<StockAdjustmentProduct[]>(
    () => stockAdjustmentProductsQuery.data ?? [],
    [stockAdjustmentProductsQuery.data],
  );
  const fieldOptions = useMemo(
    () => (fieldsOptionsQuery.data ?? []).map((field) => ({ label: field.name, value: field.id })),
    [fieldsOptionsQuery.data],
  );

  return {
    categories,
    taxes,
    warehouses,
    products,
    stockAdjustmentProducts,
    fieldOptions,
    counts: {
      categories: categoriesQuery.data?.total ?? categories.length,
      taxes: taxesQuery.data?.total ?? taxes.length,
      warehouses: warehousesQuery.data?.total ?? warehouses.length,
      products: productsQuery.data?.total ?? products.length,
      stockAdjustmentProducts: stockAdjustmentProducts.length,
    },
    isLoading:
      categoriesQuery.isLoading ||
      taxesQuery.isLoading ||
      warehousesQuery.isLoading ||
      productsQuery.isLoading ||
      stockAdjustmentProductsQuery.isLoading,
    isRefreshing:
      categoriesQuery.isFetching ||
      taxesQuery.isFetching ||
      warehousesQuery.isFetching ||
      productsQuery.isFetching ||
      stockAdjustmentProductsQuery.isFetching,
    isMutating,
    errorMessage: categoriesQuery.error
      ? toErrorMessage(categoriesQuery.error, 'Failed to load categories.')
      : taxesQuery.error
        ? toErrorMessage(taxesQuery.error, 'Failed to load taxes.')
        : warehousesQuery.error
          ? toErrorMessage(warehousesQuery.error, 'Failed to load warehouses.')
          : productsQuery.error
            ? toErrorMessage(productsQuery.error, 'Failed to load products.')
            : stockAdjustmentProductsQuery.error
              ? toErrorMessage(
                  stockAdjustmentProductsQuery.error,
                  'Failed to load stock-adjustment products.',
                )
              : fieldsOptionsQuery.error
                ? toErrorMessage(fieldsOptionsQuery.error, 'Failed to load field options.')
                : null,
    refresh: async () => {
      await Promise.all([
        categoriesQuery.refetch(),
        taxesQuery.refetch(),
        warehousesQuery.refetch(),
        productsQuery.refetch(),
        stockAdjustmentProductsQuery.refetch(),
        fieldsOptionsQuery.refetch(),
      ]);
    },
    createCategory: (input: CreateCategoryRequest) => createCategoryMutation.mutateAsync(input),
    updateCategory: (categoryId: string, input: UpdateCategoryRequest) =>
      updateCategoryMutation.mutateAsync({ categoryId, input }),
    createTax: (input: CreateTaxRequest) => createTaxMutation.mutateAsync(input),
    updateTax: (taxId: string, input: UpdateTaxRequest) =>
      updateTaxMutation.mutateAsync({ taxId, input }),
    createWarehouse: (input: CreateWarehouseRequest) => createWarehouseMutation.mutateAsync(input),
    updateWarehouse: (warehouseId: string, input: UpdateWarehouseRequest) =>
      updateWarehouseMutation.mutateAsync({ warehouseId, input }),
    createProduct: (input: CreateProductRequest) => createProductMutation.mutateAsync(input),
    updateProduct: (productId: string, input: UpdateProductRequest) =>
      updateProductMutation.mutateAsync({ productId, input }),
    hardDeleteProducts: (input: HardDeleteProductsRequest) =>
      hardDeleteProductsMutation.mutateAsync(input),
  };
}
