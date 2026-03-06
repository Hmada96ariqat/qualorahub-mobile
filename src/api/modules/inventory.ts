import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import {
  isRecord,
  normalizeRows,
  readArray,
  readBoolean,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';

type CategoryCreateResponse =
  operations['CatalogWriteController_createCategory_v1']['responses'][201]['content']['application/json'];
type CategoryUpdateResponse =
  operations['CatalogWriteController_updateCategory_v1']['responses'][200]['content']['application/json'];
type EnableStorefrontCategoriesResponse =
  operations['CatalogWriteController_enableStorefrontForActiveCategories_v1']['responses'][200]['content']['application/json'];

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

type DeactivateProductsResponse =
  operations['OrderWriteController_bulkDeactivateProducts_v1']['responses'][200]['content']['application/json'];

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
type ListContactsResponse = operations['CatalogReadController_getContacts_v1']['responses'][200] extends {
  content: { 'application/json': infer TPayload };
}
  ? TPayload
  : unknown;
type ListCropsForGuidanceResponse =
  operations['OrderWriteController_listCropsForGuidance_v1']['responses'][200] extends {
    content: { 'application/json': infer TPayload };
  }
    ? TPayload
    : unknown;

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
type CreateContactRequestContract =
  operations['CatalogWriteController_createContact_v1']['requestBody']['content']['application/json'];
type CreateProductRequestContract =
  operations['OrderWriteController_createProduct_v1']['requestBody']['content']['application/json'];
type UpdateProductRequestContract =
  operations['OrderWriteController_updateProduct_v1']['requestBody']['content']['application/json'];
type DeactivateProductsRequestContract =
  operations['OrderWriteController_bulkDeactivateProducts_v1']['requestBody']['content']['application/json'];

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
  warehouseTypes: Array<
    | 'cold_storage'
    | 'seed_storage'
    | 'fertilizer'
    | 'packing_house'
    | 'livestock_shelter'
    | 'greenhouse'
    | 'fuel_storage'
    | 'other'
  >;
  temperatureMin: number | null;
  temperatureMax: number | null;
  safetyMeasures: string | null;
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
  supplierId: string | null;
  manufacturerId: string | null;
  manufacturer: string | null;
  productType: string | null;
  otherProductType: string | null;
  usageType: 'Both' | 'Selling' | 'FarmInput' | null;
  source: string | null;
  unit: string | null;
  sku: string | null;
  barcode: string | null;
  originCountry: string | null;
  status: InventoryStatus;
  hasExpiry: boolean;
  displayOnStorefront: boolean;
  threshold: number | null;
  pricePerUnit: number | null;
  purchasePrice: number | null;
  wholesalePrice: number | null;
  productFormCode: string | null;
  activeIngredients: unknown;
  doseText: string | null;
  doseUnit: string | null;
  activeIngredientConcentrationPercent: string | null;
  phiMinDays: number | null;
  phiMaxDays: number | null;
  targetOrganismsText: string | null;
  referenceUrls: unknown;
  cropGuidanceRows: unknown;
  inventoryRecords: unknown;
  images: unknown;
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

export type InventoryContactOption = {
  id: string;
  name: string;
  contactTypes: string[];
};

export type InventoryCropOption = {
  id: string;
  name: string;
};

export type CreateCategoryRequest = CreateCategoryRequestContract;
export type UpdateCategoryRequest = UpdateCategoryRequestContract;
export type CreateTaxRequest = CreateTaxRequestContract;
export type UpdateTaxRequest = UpdateTaxRequestContract;
export type CreateWarehouseRequest = CreateWarehouseRequestContract;
export type UpdateWarehouseRequest = UpdateWarehouseRequestContract;
export type CreateContactRequest = CreateContactRequestContract;
export type CreateProductRequest = CreateProductRequestContract;
export type UpdateProductRequest = UpdateProductRequestContract;

type CreateInventoryContactFallbackRequest = {
  name: string;
  type: 'supplier' | 'manufacturer';
  contact_types: string[];
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country?: string | null;
  city_region?: string | null;
  tax_id?: string | null;
  notes?: string | null;
  status?: string;
};

// TODO(typed): OpenAPI still reports ContactCreateDto as an empty object, so fallback request
// typing remains isolated in the API layer.
export type CreateInventoryContactRequest =
  | CreateContactRequest
  | CreateInventoryContactFallbackRequest;

export type DeactivateProductsRequest = DeactivateProductsRequestContract;

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

  const warehouseTypes = readArray(payload, 'warehouse_types').filter(
    (
      item,
    ): item is
      | 'cold_storage'
      | 'seed_storage'
      | 'fertilizer'
      | 'packing_house'
      | 'livestock_shelter'
      | 'greenhouse'
      | 'fuel_storage'
      | 'other' =>
      item === 'cold_storage' ||
      item === 'seed_storage' ||
      item === 'fertilizer' ||
      item === 'packing_house' ||
      item === 'livestock_shelter' ||
      item === 'greenhouse' ||
      item === 'fuel_storage' ||
      item === 'other',
  );

  return {
    id,
    name: readString(payload, 'name'),
    fieldId: readNullableString(payload, 'field_id'),
    capacityValue: readNullableNumber(payload.capacity_value),
    capacityUnit: readNullableString(payload, 'capacity_unit'),
    warehouseTypes,
    temperatureMin: readNullableNumber(payload.temperature_min),
    temperatureMax: readNullableNumber(payload.temperature_max),
    safetyMeasures: readNullableString(payload, 'safety_measures'),
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
    supplierId: readNullableString(payload, 'supplier_id'),
    manufacturerId: readNullableString(payload, 'manufacturer_id'),
    manufacturer: readNullableString(payload, 'manufacturer'),
    productType: readNullableString(payload, 'product_type'),
    otherProductType: readNullableString(payload, 'other_product_type'),
    usageType:
      readString(payload, 'usage_type') === 'Selling'
        ? 'Selling'
        : readString(payload, 'usage_type') === 'FarmInput'
          ? 'FarmInput'
          : readString(payload, 'usage_type') === 'Both'
            ? 'Both'
            : null,
    source: readNullableString(payload, 'source'),
    unit: readNullableString(payload, 'unit'),
    sku: readNullableString(payload, 'sku'),
    barcode: readNullableString(payload, 'barcode'),
    originCountry: readNullableString(payload, 'origin_country'),
    status: readString(payload, 'status', 'active'),
    hasExpiry: readBoolean(payload, 'has_expiry'),
    displayOnStorefront: readBoolean(payload, 'display_on_storefront'),
    threshold: readNullableNumber(payload.threshold),
    pricePerUnit: readNullableNumber(payload.price_per_unit),
    purchasePrice: readNullableNumber(payload.purchase_price),
    wholesalePrice: readNullableNumber(payload.wholesale_price),
    productFormCode: readNullableString(payload, 'product_form_code'),
    activeIngredients: payload.active_ingredients,
    doseText: readNullableString(payload, 'dose_text'),
    doseUnit: readNullableString(payload, 'dose_unit'),
    activeIngredientConcentrationPercent: readNullableString(
      payload,
      'active_ingredient_concentration_percent',
    ),
    phiMinDays: readNullableNumber(payload.phi_min_days),
    phiMaxDays: readNullableNumber(payload.phi_max_days),
    targetOrganismsText: readNullableString(payload, 'target_organisms_text'),
    referenceUrls: payload.reference_urls,
    cropGuidanceRows: payload.crop_guidance_rows,
    inventoryRecords: payload.inventoryRecords,
    images: payload.images,
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

function parseContactOption(payload: unknown): InventoryContactOption | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  const contactTypes = readArray(payload, 'contact_types').filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );

  return {
    id,
    name: readString(payload, 'name'),
    contactTypes,
  };
}

function parseCropOption(payload: unknown): InventoryCropOption | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  const name =
    readString(payload, 'name') ||
    readString(payload, 'crop_name') ||
    readString(payload, 'label') ||
    'Crop';

  return {
    id,
    name,
  };
}

function parseRows<T>(payload: unknown, parser: (item: unknown) => T | null): T[] {
  const rows = isRecord(payload) && Array.isArray(payload.items) ? payload.items : normalizeRows(payload);

  return rows
    .map((row) => parser(row))
    .filter((row): row is T => Boolean(row));
}

function normalizeContactCreateRequest(input: CreateInventoryContactRequest): UnknownRecord {
  const record = isRecord(input) ? input : {};
  const normalizedName = readString(record, 'name').trim();
  if (!normalizedName) {
    throw new Error('Contact name is required.');
  }

  const normalizedType = readString(record, 'type') === 'manufacturer' ? 'manufacturer' : 'supplier';
  const providedTypes = readArray(record, 'contact_types').filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );
  const contactTypes = providedTypes.length > 0 ? providedTypes : [normalizedType];

  return {
    name: normalizedName,
    type: normalizedType,
    contact_types: contactTypes,
    company: readNullableString(record, 'company'),
    phone: readNullableString(record, 'phone'),
    email: readNullableString(record, 'email'),
    address: readNullableString(record, 'address'),
    country: readNullableString(record, 'country'),
    city_region: readNullableString(record, 'city_region'),
    tax_id: readNullableString(record, 'tax_id'),
    notes: readNullableString(record, 'notes'),
    status: readString(record, 'status', 'active'),
  };
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

export async function enableStorefrontForActiveCategories(token: string): Promise<number> {
  const { data } = await apiClient.patch<EnableStorefrontCategoriesResponse>(
    '/categories/bulk/enable-storefront',
    {
      token,
    },
  );
  return typeof data.updated === 'number' ? data.updated : 0;
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

export async function listSupplierContacts(token: string): Promise<InventoryContactOption[]> {
  const { data } = await apiClient.get<ListContactsResponse>(
    '/contacts?limit=200&offset=0&status=active&contactTypes=supplier',
    { token },
  );

  return parseRows(data, parseContactOption);
}

export async function listManufacturerContacts(token: string): Promise<InventoryContactOption[]> {
  const { data } = await apiClient.get<ListContactsResponse>(
    '/contacts?limit=200&offset=0&status=active&contactTypes=manufacturer',
    { token },
  );

  return parseRows(data, parseContactOption);
}

export async function createInventoryContact(
  token: string,
  input: CreateInventoryContactRequest,
): Promise<void> {
  await apiClient.post<unknown, UnknownRecord>('/contacts', {
    token,
    body: normalizeContactCreateRequest(input),
    idempotencyKey: `contacts-create-${Date.now()}`,
  });
}

export async function listCropsForGuidance(token: string): Promise<InventoryCropOption[]> {
  const { data } = await apiClient.get<ListCropsForGuidanceResponse>('/crops/guidance', { token });
  return parseRows(data, parseCropOption);
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

export async function deactivateProducts(
  token: string,
  input: DeactivateProductsRequest,
): Promise<number> {
  const requestBody = isRecord(input)
    ? { ids: Array.isArray(input.ids) ? input.ids : [] }
    : { ids: [] };

  if (requestBody.ids.length === 0) {
    throw new Error('Deactivate requires at least one product ID.');
  }

  const { data } = await apiClient.post<DeactivateProductsResponse, DeactivateProductsRequest>(
    '/products/commands/deactivate',
    {
      token,
      body: requestBody,
      idempotencyKey: `products-deactivate-${Date.now()}`,
    },
  );

  return typeof data.deactivatedCount === 'number' ? data.deactivatedCount : 0;
}
