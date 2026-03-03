import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  createInventoryContact,
  enableStorefrontForActiveCategories,
  createProduct,
  createTax,
  createWarehouse,
  hardDeleteProducts,
  listCategories,
  listCropsForGuidance,
  listManufacturerContacts,
  listProducts,
  listStockAdjustmentProducts,
  listSupplierContacts,
  listTaxes,
  listWarehouses,
  updateCategory,
  updateProduct,
  updateTax,
  updateWarehouse,
  type CreateCategoryRequest,
  type CreateInventoryContactRequest,
  type CreateProductRequest,
  type CreateTaxRequest,
  type CreateWarehouseRequest,
  type HardDeleteProductsRequest,
  type InventoryCategory,
  type InventoryContactOption,
  type InventoryCropOption,
  type InventoryProduct,
  type InventoryTax,
  type InventoryWarehouse,
  type StockAdjustmentProduct,
  type UpdateCategoryRequest,
  type UpdateProductRequest,
  type UpdateTaxRequest,
  type UpdateWarehouseRequest,
} from '../../api/modules/inventory';
import { createField, listFields } from '../../api/modules/fields';
import { useAuthSession } from '../../hooks/useAuthSession';

const CATEGORIES_QUERY_KEY = ['inventory', 'categories'] as const;
const TAXES_QUERY_KEY = ['inventory', 'taxes'] as const;
const WAREHOUSES_QUERY_KEY = ['inventory', 'warehouses'] as const;
const PRODUCTS_QUERY_KEY = ['inventory', 'products'] as const;
const STOCK_ADJUSTMENT_PRODUCTS_QUERY_KEY = ['inventory', 'stock-adjustment-products'] as const;
const FIELDS_OPTIONS_QUERY_KEY = ['inventory', 'fields-options'] as const;
const SUPPLIERS_QUERY_KEY = ['inventory', 'supplier-contacts'] as const;
const MANUFACTURERS_QUERY_KEY = ['inventory', 'manufacturer-contacts'] as const;
const CROPS_QUERY_KEY = ['inventory', 'crop-guidance-options'] as const;

export type CreateContactOptionInput = {
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country?: string | null;
  cityRegion?: string | null;
  taxId?: string | null;
  notes?: string | null;
};

function findBestContactOptionMatch(
  options: InventoryContactOption[],
  input: CreateContactOptionInput,
): InventoryContactOption | null {
  const targetName = input.name.trim().toLowerCase();
  for (let index = options.length - 1; index >= 0; index -= 1) {
    const option = options[index];
    if (option.name.trim().toLowerCase() === targetName) {
      return option;
    }
  }

  return null;
}

export function resolveCreatedContactOption(input: {
  previousOptions: InventoryContactOption[];
  refreshedOptions: InventoryContactOption[];
  draft: CreateContactOptionInput;
}): InventoryContactOption | null {
  const { previousOptions, refreshedOptions, draft } = input;
  const previousIds = new Set(previousOptions.map((option) => option.id));
  const nameMatches = refreshedOptions.filter(
    (option) => option.name.trim().toLowerCase() === draft.name.trim().toLowerCase(),
  );

  const newNameMatch = nameMatches.find((option) => !previousIds.has(option.id));
  if (newNameMatch) {
    return newNameMatch;
  }

  const addedOptions = refreshedOptions.filter((option) => !previousIds.has(option.id));
  if (addedOptions.length === 1) {
    return addedOptions[0];
  }

  if (nameMatches.length > 0) {
    return nameMatches[nameMatches.length - 1];
  }

  return findBestContactOptionMatch(refreshedOptions, draft);
}

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

  const supplierContactsQuery = useQuery({
    queryKey: SUPPLIERS_QUERY_KEY,
    queryFn: () => listSupplierContacts(token ?? ''),
    enabled: Boolean(token),
  });

  const manufacturerContactsQuery = useQuery({
    queryKey: MANUFACTURERS_QUERY_KEY,
    queryFn: () => listManufacturerContacts(token ?? ''),
    enabled: Boolean(token),
  });

  const cropsQuery = useQuery({
    queryKey: CROPS_QUERY_KEY,
    queryFn: () => listCropsForGuidance(token ?? ''),
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

  const enableStorefrontCategoriesMutation = useMutation({
    mutationFn: () => enableStorefrontForActiveCategories(token ?? ''),
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

  const createFieldOptionMutation = useMutation({
    mutationFn: (input: { name: string; areaHectares: number }) =>
      createField(token ?? '', {
        name: input.name,
        area_hectares: input.areaHectares,
        status: 'active',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FIELDS_OPTIONS_QUERY_KEY });
    },
  });

  const createContactOptionMutation = useMutation({
    mutationFn: (input: CreateInventoryContactRequest) => createInventoryContact(token ?? '', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: MANUFACTURERS_QUERY_KEY }),
      ]);
    },
  });

  const isMutating =
    createCategoryMutation.isPending ||
    enableStorefrontCategoriesMutation.isPending ||
    updateCategoryMutation.isPending ||
    createTaxMutation.isPending ||
    updateTaxMutation.isPending ||
    createWarehouseMutation.isPending ||
    updateWarehouseMutation.isPending ||
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    hardDeleteProductsMutation.isPending ||
    createFieldOptionMutation.isPending ||
    createContactOptionMutation.isPending;

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
  const supplierOptions = useMemo<InventoryContactOption[]>(
    () => supplierContactsQuery.data ?? [],
    [supplierContactsQuery.data],
  );
  const manufacturerOptions = useMemo<InventoryContactOption[]>(
    () => manufacturerContactsQuery.data ?? [],
    [manufacturerContactsQuery.data],
  );
  const cropOptions = useMemo<InventoryCropOption[]>(() => cropsQuery.data ?? [], [cropsQuery.data]);

  return {
    categories,
    taxes,
    warehouses,
    products,
    stockAdjustmentProducts,
    fieldOptions,
    supplierOptions,
    manufacturerOptions,
    cropOptions,
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
      stockAdjustmentProductsQuery.isLoading ||
      fieldsOptionsQuery.isLoading ||
      supplierContactsQuery.isLoading ||
      manufacturerContactsQuery.isLoading ||
      cropsQuery.isLoading,
    isRefreshing:
      categoriesQuery.isFetching ||
      taxesQuery.isFetching ||
      warehousesQuery.isFetching ||
      productsQuery.isFetching ||
      stockAdjustmentProductsQuery.isFetching ||
      fieldsOptionsQuery.isFetching ||
      supplierContactsQuery.isFetching ||
      manufacturerContactsQuery.isFetching ||
      cropsQuery.isFetching,
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
                : supplierContactsQuery.error
                  ? toErrorMessage(
                      supplierContactsQuery.error,
                      'Failed to load supplier contact options.',
                    )
                  : manufacturerContactsQuery.error
                    ? toErrorMessage(
                        manufacturerContactsQuery.error,
                        'Failed to load manufacturer contact options.',
                      )
                    : cropsQuery.error
                      ? toErrorMessage(cropsQuery.error, 'Failed to load crop guidance options.')
                : null,
    refresh: async () => {
      await Promise.all([
        categoriesQuery.refetch(),
        taxesQuery.refetch(),
        warehousesQuery.refetch(),
        productsQuery.refetch(),
        stockAdjustmentProductsQuery.refetch(),
        fieldsOptionsQuery.refetch(),
        supplierContactsQuery.refetch(),
        manufacturerContactsQuery.refetch(),
        cropsQuery.refetch(),
      ]);
    },
    createCategory: (input: CreateCategoryRequest) => createCategoryMutation.mutateAsync(input),
    enableStorefrontForActiveCategories: () => enableStorefrontCategoriesMutation.mutateAsync(),
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
    createFieldOption: async (input: { name: string; areaHectares: number }) => {
      const field = await createFieldOptionMutation.mutateAsync(input);
      return {
        label: field.name,
        value: field.id,
      };
    },
    createSupplierOption: async (input: CreateContactOptionInput) => {
      const name = input.name.trim();
      if (!name) {
        throw new Error('Supplier name is required.');
      }

      const previousOptions = queryClient.getQueryData<InventoryContactOption[]>(SUPPLIERS_QUERY_KEY)
        ?? supplierOptions;

      await createContactOptionMutation.mutateAsync({
        name,
        type: 'supplier',
        contact_types: ['supplier'],
        company: input.company ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        country: input.country ?? null,
        city_region: input.cityRegion ?? null,
        tax_id: input.taxId ?? null,
        notes: input.notes ?? null,
        status: 'active',
      });

      const refreshed = await listSupplierContacts(token ?? '');
      queryClient.setQueryData(SUPPLIERS_QUERY_KEY, refreshed);
      const matched = resolveCreatedContactOption({
        previousOptions,
        refreshedOptions: refreshed,
        draft: input,
      });
      if (!matched) {
        throw new Error('Supplier created but could not be resolved in refreshed options.');
      }

      return {
        label: matched.name,
        value: matched.id,
      };
    },
    createManufacturerOption: async (input: CreateContactOptionInput) => {
      const name = input.name.trim();
      if (!name) {
        throw new Error('Manufacturer name is required.');
      }

      const previousOptions = queryClient.getQueryData<InventoryContactOption[]>(
        MANUFACTURERS_QUERY_KEY,
      )
        ?? manufacturerOptions;

      await createContactOptionMutation.mutateAsync({
        name,
        type: 'manufacturer',
        contact_types: ['manufacturer'],
        company: input.company ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        country: input.country ?? null,
        city_region: input.cityRegion ?? null,
        tax_id: input.taxId ?? null,
        notes: input.notes ?? null,
        status: 'active',
      });

      const refreshed = await listManufacturerContacts(token ?? '');
      queryClient.setQueryData(MANUFACTURERS_QUERY_KEY, refreshed);
      const matched = resolveCreatedContactOption({
        previousOptions,
        refreshedOptions: refreshed,
        draft: input,
      });
      if (!matched) {
        throw new Error('Manufacturer created but could not be resolved in refreshed options.');
      }

      return {
        label: matched.name,
        value: matched.id,
      };
    },
  };
}
