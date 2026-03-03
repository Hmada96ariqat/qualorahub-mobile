import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import {
  isRecord,
  readBoolean,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';
import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';

type CategoryCreateResponse =
  operations['CatalogWriteController_createCategory_v1']['responses'][201]['content']['application/json'];
type CategoryUpdateResponse =
  operations['CatalogWriteController_updateCategory_v1']['responses'][200]['content']['application/json'];

type TaxCreateResponse =
  operations['CatalogWriteController_createTax_v1']['responses'][201]['content']['application/json'];
type TaxUpdateResponse =
  operations['CatalogWriteController_updateTax_v1']['responses'][200]['content']['application/json'];

type WarehouseCreateResponse =
  operations['CatalogWriteController_createWarehouse_v1']['responses'][201]['content']['application/json'];
type WarehouseUpdateResponse =
  operations['CatalogWriteController_updateWarehouse_v1']['responses'][200]['content']['application/json'];

type ProductCreateResponse =
  operations['OrderWriteController_createProduct_v1']['responses'][201]['content']['application/json'];
type ProductUpdateResponse =
  operations['OrderWriteController_updateProduct_v1']['responses'][200]['content']['application/json'];

type HardDeleteProductsResponse =
  operations['OrderWriteController_bulkHardDeleteProducts_v1']['responses'][200]['content']['application/json'];

type ListCategoriesResponse =
  operations['CatalogReadController_getCategories_v1']['responses'][200]['content']['application/json'];
type ListTaxesResponse =
  operations['CatalogReadController_getTaxes_v1']['responses'][200]['content']['application/json'];
type ListWarehousesResponse =
  operations['CatalogReadController_getWarehouses_v1']['responses'][200]['content']['application/json'];
type ListProductsResponse =
  operations['CatalogReadController_getProducts_v1']['responses'][200]['content']['application/json'];
type ListStockAdjustmentProductsResponse =
  operations['OrderWriteController_listProductsForStockAdjustment_v1']['responses'][200]['content']['application/json'];

type CreateCategoryRequestContract =
  operations['CatalogWriteController_createCategory_v1']['requestBody']['content']['application/json'];
type UpdateCategoryRequestContract =
  operations['CatalogWriteController_updateCategory_v1']['requestBody']['content']['application/json'];
type CreateTaxRequestContract =
  operations['CatalogWriteController_createTax_v1']['requestBody']['content']['application/json'];
type UpdateTaxRequestContract =
  operations['CatalogWriteController_updateTax_v1']['requestBody']['content']['application/json'];
type CreateWarehouseRequestContract =
  operations['CatalogWriteController_createWarehouse_v1']['requestBody']['content']['application/json'];
type UpdateWarehouseRequestContract =
  operations['CatalogWriteController_updateWarehouse_v1']['requestBody']['content']['application/json'];
type CreateProductRequestContract =
  operations['OrderWriteController_createProduct_v1']['requestBody']['content']['application/json'];
type UpdateProductRequestContract =
  operations['OrderWriteController_updateProduct_v1']['requestBody']['content']['application/json'];
type HardDeleteProductsRequestContract =
  operations['OrderWriteController_bulkHardDeleteProducts_v1']['requestBody']['content']['application/json'];

export type InventoryStatus = 'active' | 'inactive' | string;

export type PaginatedCatalogResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type CatalogListOptions = {
  limit?: number;
  offset?: number;
  status?: 'active' | 'inactive' | 'all';
};

export type InventoryCategory = {
  id: string;
  name: string;
  parentId: string | null;
  imageUrl: string | null;
  displayOnStorefront: boolean;
  notes: string | null;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
};

export type InventoryTax = {
  id: string;
  name: string;
  rate: number;
  notes: string | null;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
};

export type InventoryWarehouse = {
  id: string;
  name: string;
  fieldId: string | null;
  capacityValue: number | null;
  capacityUnit: string | null;
  status: InventoryStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryProduct = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  taxId: string | null;
  productType: string | null;
  source: string | null;
  unit: string | null;
  sku: string | null;
  barcode: string | null;
  status: InventoryStatus;
  hasExpiry: boolean;
  displayOnStorefront: boolean;
  threshold: number | null;
  pricePerUnit: number | null;
  purchasePrice: number | null;
  wholesalePrice: number | null;
  createdAt: string;
  updatedAt: string;
};

export type StockAdjustmentProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  hasExpiry: boolean;
  status: InventoryStatus;
};

export type CreateCategoryRequest = CreateCategoryRequestContract;
export type UpdateCategoryRequest = UpdateCategoryRequestContract;
export type CreateTaxRequest = CreateTaxRequestContract;
export type UpdateTaxRequest = UpdateTaxRequestContract;
export type CreateWarehouseRequest = CreateWarehouseRequestContract;
export type UpdateWarehouseRequest = UpdateWarehouseRequestContract;
export type CreateProductRequest = CreateProductRequestContract;
export type UpdateProductRequest = UpdateProductRequestContract;

type HardDeleteProductsFallbackRequest = {
  ids: string[];
};

// TODO(typed): Remove this fallback when BulkHardDeleteProductsCommandDto request schema is typed
// (tracked as QH-OAPI-012).
export type HardDeleteProductsRequest =
  | HardDeleteProductsRequestContract
  | HardDeleteProductsFallbackRequest;

function readNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = readNullableNumber(value);
  return parsed ?? fallback;
}

function parseCategory(payload: unknown): InventoryCategory | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name'),
    parentId: readNullableString(payload, 'parent_id'),
    imageUrl: readNullableString(payload, 'image_url'),
    displayOnStorefront: readBoolean(payload, 'display_on_storefront'),
    notes: readNullableString(payload, 'notes'),
    status: readString(payload, 'status', 'active'),
    createdAt: readString(payload, 'created_at'),
    updatedAt: readString(payload, 'updated_at'),
  };
}

function parseTax(payload: unknown): InventoryTax | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name'),
    rate: readNumber(payload.rate, 0),
    notes: readNullableString(payload, 'notes'),
    status: readString(payload, 'status', 'active'),
    createdAt: readString(payload, 'created_at'),
    updatedAt: readString(payload, 'updated_at'),
  };
}

function parseWarehouse(payload: unknown): InventoryWarehouse | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name'),
    fieldId: readNullableString(payload, 'field_id'),
    capacityValue: readNullableNumber(payload.capacity_value),
    capacityUnit: readNullableString(payload, 'capacity_unit'),
    status: readString(payload, 'status', 'active'),
    notes: readNullableString(payload, 'notes'),
    createdAt: readString(payload, 'created_at'),
    updatedAt: readString(payload, 'updated_at'),
  };
}

function parseProduct(payload: unknown): InventoryProduct | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name'),
    description: readNullableString(payload, 'description'),
    categoryId: readNullableString(payload, 'category_id'),
    taxId: readNullableString(payload, 'tax_id'),
    productType: readNullableString(payload, 'product_type'),
    source: readNullableString(payload, 'source'),
    unit: readNullableString(payload, 'unit'),
    sku: readNullableString(payload, 'sku'),
    barcode: readNullableString(payload, 'barcode'),
    status: readString(payload, 'status', 'active'),
    hasExpiry: readBoolean(payload, 'has_expiry'),
    displayOnStorefront: readBoolean(payload, 'display_on_storefront'),
    threshold: readNullableNumber(payload.threshold),
    pricePerUnit: readNullableNumber(payload.price_per_unit),
    purchasePrice: readNullableNumber(payload.purchase_price),
    wholesalePrice: readNullableNumber(payload.wholesale_price),
    createdAt: readString(payload, 'created_at'),
    updatedAt: readString(payload, 'updated_at'),
  };
}

function parseStockAdjustmentProduct(payload: unknown): StockAdjustmentProduct | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name'),
    sku: readNullableString(payload, 'sku'),
    barcode: readNullableString(payload, 'barcode'),
    unit: readNullableString(payload, 'unit'),
    hasExpiry: readBoolean(payload, 'has_expiry'),
    status: readString(payload, 'status', 'active'),
  };
}

function parsePaginatedResult<T>(
  payload: UnknownRecord,
  parser: (item: unknown) => T | null,
): PaginatedCatalogResult<T> {
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items = rawItems.map((item) => parser(item)).filter((item): item is T => Boolean(item));
  const total = readNumber(payload.total, items.length);
  const limit = readNumber(payload.limit, items.length);
  const offset = readNumber(payload.offset, 0);

  return {
    items,
    total,
    limit,
    offset,
  };
}

function parseMutationResult<T>(
  payload: unknown,
  parser: (item: unknown) => T | null,
  errorMessage: string,
): T {
  const parsed = parser(payload);
  if (!parsed) throw new Error(errorMessage);
  return parsed;
}

function buildCatalogQuery(options: CatalogListOptions = {}): string {
  const params = new URLSearchParams();
  if (typeof options.limit === 'number') params.set('limit', String(options.limit));
  if (typeof options.offset === 'number') params.set('offset', String(options.offset));
  if (options.status && options.status !== 'all') params.set('status', options.status);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function listCategories(
  token: string,
  options: CatalogListOptions = {},
): Promise<PaginatedCatalogResult<InventoryCategory>> {
  const { data } = await apiClient.get<ListCategoriesResponse>(`/categories${buildCatalogQuery(options)}`, {
    token,
  });
  return parsePaginatedResult(data as UnknownRecord, parseCategory);
}

export async function createCategory(
  token: string,
  input: CreateCategoryRequest,
): Promise<InventoryCategory> {
  const { data } = await apiClient.post<CategoryCreateResponse, CreateCategoryRequest>(
    '/categories',
    {
      token,
      body: input,
      idempotencyKey: `categories-create-${Date.now()}`,
    },
  );
  return parseMutationResult(data, parseCategory, 'Categories API returned an empty create payload.');
}

export async function updateCategory(
  token: string,
  categoryId: string,
  input: UpdateCategoryRequest,
): Promise<InventoryCategory> {
  const { data } = await apiClient.patch<CategoryUpdateResponse, UpdateCategoryRequest>(
    `/categories/${categoryId}`,
    {
      token,
      body: input,
    },
  );
  return parseMutationResult(data, parseCategory, 'Categories API returned an empty update payload.');
}

export async function listTaxes(
  token: string,
  options: CatalogListOptions = {},
): Promise<PaginatedCatalogResult<InventoryTax>> {
  const { data } = await apiClient.get<ListTaxesResponse>(`/taxes${buildCatalogQuery(options)}`, { token });
  return parsePaginatedResult(data as UnknownRecord, parseTax);
}

export async function createTax(
  token: string,
  input: CreateTaxRequest,
): Promise<InventoryTax> {
  const { data } = await apiClient.post<TaxCreateResponse, CreateTaxRequest>('/taxes', {
    token,
    body: input,
    idempotencyKey: `taxes-create-${Date.now()}`,
  });
  return parseMutationResult(data, parseTax, 'Taxes API returned an empty create payload.');
}

export async function updateTax(
  token: string,
  taxId: string,
  input: UpdateTaxRequest,
): Promise<InventoryTax> {
  const { data } = await apiClient.patch<TaxUpdateResponse, UpdateTaxRequest>(`/taxes/${taxId}`, {
    token,
    body: input,
  });
  return parseMutationResult(data, parseTax, 'Taxes API returned an empty update payload.');
}

export async function listWarehouses(
  token: string,
  options: CatalogListOptions = {},
): Promise<PaginatedCatalogResult<InventoryWarehouse>> {
  const { data } = await apiClient.get<ListWarehousesResponse>(
    `/warehouses${buildCatalogQuery(options)}`,
    { token },
  );
  return parsePaginatedResult(data as UnknownRecord, parseWarehouse);
}

export async function createWarehouse(
  token: string,
  input: CreateWarehouseRequest,
): Promise<InventoryWarehouse> {
  const { data } = await apiClient.post<WarehouseCreateResponse, CreateWarehouseRequest>(
    '/warehouses',
    {
      token,
      body: input,
      idempotencyKey: `warehouses-create-${Date.now()}`,
    },
  );
  return parseMutationResult(data, parseWarehouse, 'Warehouses API returned an empty create payload.');
}

export async function updateWarehouse(
  token: string,
  warehouseId: string,
  input: UpdateWarehouseRequest,
): Promise<InventoryWarehouse> {
  const { data } = await apiClient.patch<WarehouseUpdateResponse, UpdateWarehouseRequest>(
    `/warehouses/${warehouseId}`,
    {
      token,
      body: input,
    },
  );
  return parseMutationResult(data, parseWarehouse, 'Warehouses API returned an empty update payload.');
}

export async function listProducts(
  token: string,
  options: CatalogListOptions = {},
): Promise<PaginatedCatalogResult<InventoryProduct>> {
  const { data } = await apiClient.get<ListProductsResponse>(`/products${buildCatalogQuery(options)}`, {
    token,
  });
  return parsePaginatedResult(data as UnknownRecord, parseProduct);
}

export async function listStockAdjustmentProducts(
  token: string,
): Promise<StockAdjustmentProduct[]> {
  const { data } = await apiClient.get<ListStockAdjustmentProductsResponse>(
    '/inventory/stock-adjustment/products',
    { token },
  );
  return data
    .map((item) => parseStockAdjustmentProduct(item))
    .filter((item): item is StockAdjustmentProduct => Boolean(item));
}

export async function createProduct(
  token: string,
  input: CreateProductRequest,
): Promise<InventoryProduct> {
  const { data } = await apiClient.post<ProductCreateResponse, CreateProductRequest>('/products', {
    token,
    body: input,
    idempotencyKey: `products-create-${Date.now()}`,
  });
  return parseMutationResult(data, parseProduct, 'Products API returned an empty create payload.');
}

export async function updateProduct(
  token: string,
  productId: string,
  input: UpdateProductRequest,
): Promise<InventoryProduct> {
  const { data } = await apiClient.patch<ProductUpdateResponse, UpdateProductRequest>(
    `/products/${productId}`,
    {
      token,
      body: input,
    },
  );
  return parseMutationResult(data, parseProduct, 'Products API returned an empty update payload.');
}

export async function hardDeleteProducts(
  token: string,
  input: HardDeleteProductsRequest,
): Promise<number> {
  const requestBody = isRecord(input)
    ? { ids: Array.isArray(input.ids) ? input.ids : [] }
    : { ids: [] };

  if (requestBody.ids.length === 0) {
    throw new Error(
      `Hard-delete requires at least one product ID (${OPENAPI_BLOCKER_IDS.PRODUCTS_HARD_DELETE_REQUEST_DTO}).`,
    );
  }

  const { data } = await apiClient.post<HardDeleteProductsResponse, HardDeleteProductsFallbackRequest>(
    '/products/commands/hard-delete',
    {
      token,
      body: requestBody,
      idempotencyKey: `products-hard-delete-${Date.now()}`,
    },
  );

  return typeof data.deletedCount === 'number' ? data.deletedCount : 0;
}
