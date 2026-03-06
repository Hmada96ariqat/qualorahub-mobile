import React from 'react';
import { fireEvent, waitFor, within } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import { InventoryScreen } from '../screens/InventoryScreen';
import { useInventoryModule } from '../useInventoryModule.hook';

jest.mock('../useInventoryModule.hook', () => ({
  useInventoryModule: jest.fn(),
}));

jest.mock('../../../hooks/useModuleActionPermissions', () => ({
  useModuleActionPermissions: () => ({
    loading: false,
    permissions: {
      view: true,
      add: true,
      edit: true,
      delete: true,
    },
  }),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <InventoryScreen />
    </ToastProvider>,
  );
}

describe('InventoryScreen inventory-tab integration', () => {
  const useInventoryModuleMock = jest.mocked(useInventoryModule);
  const createCategoryMock = jest.fn();
  const updateCategoryMock = jest.fn();
  const createTaxMock = jest.fn();
  const updateTaxMock = jest.fn();
  const createWarehouseMock = jest.fn();
  const updateWarehouseMock = jest.fn();
  const createProductMock = jest.fn();
  const updateProductMock = jest.fn();
  const deactivateProductsMock = jest.fn();

  const productRecord = {
    id: 'product-1',
    name: 'Starter Seed',
    description: 'Primary seed lot',
    categoryId: 'category-1',
    taxId: 'tax-1',
    supplierId: 'supplier-1',
    manufacturerId: 'manufacturer-1',
    manufacturer: 'Maker A',
    productType: 'seed',
    otherProductType: null,
    usageType: 'Selling',
    source: null,
    unit: 'bag',
    sku: 'SEED-001',
    barcode: '123456',
    originCountry: 'Jordan',
    status: 'active',
    hasExpiry: true,
    displayOnStorefront: true,
    threshold: 4,
    pricePerUnit: 12.5,
    purchasePrice: 9,
    wholesalePrice: 10.5,
    productFormCode: null,
    activeIngredients: [],
    doseText: null,
    doseUnit: null,
    activeIngredientConcentrationPercent: null,
    phiMinDays: null,
    phiMaxDays: null,
    targetOrganismsText: null,
    referenceUrls: [],
    cropGuidanceRows: [],
    inventoryRecords: [{ warehouse_id: 'warehouse-1' }],
    images: [],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  } as const;

  const inactiveProductRecord = {
    ...productRecord,
    id: 'product-2',
    name: 'Dormant Seed',
    sku: 'SEED-002',
    status: 'inactive',
  } as const;

  beforeEach(() => {
    createCategoryMock.mockReset();
    updateCategoryMock.mockReset();
    createTaxMock.mockReset();
    updateTaxMock.mockReset();
    createWarehouseMock.mockReset();
    updateWarehouseMock.mockReset();
    createProductMock.mockReset();
    updateProductMock.mockReset();
    deactivateProductsMock.mockReset();

    useInventoryModuleMock.mockReturnValue({
      categories: [
        {
          id: 'category-1',
          name: 'Seeds',
          parentId: null,
          imageUrl: null,
          displayOnStorefront: true,
          notes: null,
          status: 'active',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      taxes: [
        {
          id: 'tax-1',
          name: 'VAT',
          rate: 16,
          notes: null,
          status: 'active',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      warehouses: [
        {
          id: 'warehouse-1',
          name: 'Main Warehouse',
          fieldId: 'field-1',
          capacityValue: null,
          capacityUnit: null,
          warehouseTypes: [],
          temperatureMin: null,
          temperatureMax: null,
          safetyMeasures: null,
          status: 'active',
          notes: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      products: [productRecord, inactiveProductRecord],
      stockAdjustmentProducts: [productRecord],
      fieldOptions: [{ label: 'Field 1', value: 'field-1' }],
      supplierOptions: [{ id: 'supplier-1', name: 'Supplier A', contactTypes: ['supplier'] }],
      manufacturerOptions: [
        { id: 'manufacturer-1', name: 'Maker A', contactTypes: ['manufacturer'] },
      ],
      cropOptions: [],
      counts: {
        categories: 1,
        taxes: 1,
        warehouses: 1,
        products: 2,
        stockAdjustmentProducts: 1,
      },
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      errorMessage: null,
      refresh: async () => undefined,
      createCategory: createCategoryMock,
      updateCategory: updateCategoryMock,
      createTax: createTaxMock,
      updateTax: updateTaxMock,
      createWarehouse: createWarehouseMock,
      updateWarehouse: updateWarehouseMock,
      createProduct: createProductMock,
      updateProduct: updateProductMock,
      deactivateProducts: deactivateProductsMock,
      enableStorefrontForActiveCategories: async () => 0,
      createFieldOption: async (input: { name: string; areaHectares: number }) => ({
        label: input.name,
        value: `field-${input.name}`,
      }),
      createSupplierOption: async (input: { name: string }) => ({
        label: input.name,
        value: `supplier-${input.name}`,
      }),
      createManufacturerOption: async (input: { name: string }) => ({
        label: input.name,
        value: `manufacturer-${input.name}`,
      }),
    });
  });

  it('renders the dense products shell and opens the product detail sheet', async () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    expect(getByTestId('inventory-products-status-filter')).toBeTruthy();
    expect(getByTestId('inventory-product-row-product-1')).toBeTruthy();
    expect(queryByText('Dormant Seed')).toBeNull();

    fireEvent.press(getByText('Starter Seed'));

    await waitFor(() => {
      expect(getByTestId('inventory-product-detail')).toBeTruthy();
      expect(getByText('Commercial')).toBeTruthy();
    });
  });

  it('shows full module tab labels and switches to the other inventory sections', async () => {
    const { getByTestId } = renderScreen();

    const tabs = getByTestId('inventory-tabs');
    expect(tabs).toBeTruthy();
    expect(within(tabs).getByText('Products')).toBeTruthy();
    expect(within(tabs).getByText('Categories')).toBeTruthy();
    expect(within(tabs).getByText('Taxes')).toBeTruthy();
    expect(within(tabs).getByText('Warehouses')).toBeTruthy();

    fireEvent.press(getByTestId('inventory-tabs.categories'));
    await waitFor(() => {
      expect(getByTestId('inventory-categories-status-filter')).toBeTruthy();
      expect(getByTestId('inventory-category-row-category-1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('inventory-tabs.taxes'));
    await waitFor(() => {
      expect(getByTestId('inventory-taxes-status-filter')).toBeTruthy();
      expect(getByTestId('inventory-tax-row-tax-1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('inventory-tabs.warehouses'));
    await waitFor(() => {
      expect(getByTestId('inventory-warehouses-status-filter')).toBeTruthy();
      expect(getByTestId('inventory-warehouse-row-warehouse-1')).toBeTruthy();
    });
  });

  it('opens the create product sheet from the products header action', async () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('inventory-products-create'));

    await waitFor(() => {
      expect(getByTestId('inventory-product-form')).toBeTruthy();
      expect(getByTestId('inventory-product-form.steps')).toBeTruthy();
      expect(getByText('Basic Product Information')).toBeTruthy();
    });
  });

  it('renders the dense categories shell and opens the category detail sheet', async () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('inventory-tabs.categories'));

    await waitFor(() => expect(getByTestId('inventory-category-row-category-1')).toBeTruthy());

    fireEvent.press(getByText('Seeds'));

    await waitFor(() => {
      expect(getByTestId('inventory-category-detail')).toBeTruthy();
      expect(getByText('Category Details')).toBeTruthy();
    });
  });

  it('opens the create category sheet from the categories header action', async () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('inventory-tabs.categories'));
    await waitFor(() => expect(getByTestId('inventory-categories-create')).toBeTruthy());

    fireEvent.press(getByTestId('inventory-categories-create'));

    await waitFor(() => {
      expect(getByText('Create Category')).toBeTruthy();
      expect(getByText('Category Details')).toBeTruthy();
    });
  });

  it('renders the dense taxes shell and opens the tax detail sheet', async () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('inventory-tabs.taxes'));

    await waitFor(() => expect(getByTestId('inventory-tax-row-tax-1')).toBeTruthy());

    fireEvent.press(getByText('VAT'));

    await waitFor(() => {
      expect(getByTestId('inventory-tax-detail')).toBeTruthy();
      expect(getByText('Tax Details')).toBeTruthy();
    });
  });

  it('opens the create tax sheet from the taxes header action', async () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('inventory-tabs.taxes'));
    await waitFor(() => expect(getByTestId('inventory-products-create')).toBeTruthy());

    fireEvent.press(getByTestId('inventory-products-create'));

    await waitFor(() => {
      expect(getByText('Create Tax')).toBeTruthy();
      expect(getByText('Tax Details')).toBeTruthy();
    });
  });

  it('renders the dense warehouses shell and opens the warehouse detail sheet', async () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('inventory-tabs.warehouses'));

    await waitFor(() => expect(getByTestId('inventory-warehouse-row-warehouse-1')).toBeTruthy());

    fireEvent.press(getByText('Main Warehouse'));

    await waitFor(() => {
      expect(getByTestId('inventory-warehouse-detail')).toBeTruthy();
      expect(getByText('Warehouse Details')).toBeTruthy();
    });
  });

  it('opens the create warehouse sheet from the warehouses header action', async () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('inventory-tabs.warehouses'));
    await waitFor(() => expect(getByTestId('inventory-products-create')).toBeTruthy());

    fireEvent.press(getByTestId('inventory-products-create'));

    await waitFor(() => {
      expect(getByText('Create Warehouse')).toBeTruthy();
      expect(getByText('Warehouse Details')).toBeTruthy();
    });
  });

  it('opens the edit product sheet from product quick actions', async () => {
    const { getByText, getByTestId } = renderScreen();

    fireEvent.press(getByText('Starter Seed'));

    await waitFor(() => expect(getByTestId('inventory-product-detail')).toBeTruthy());

    fireEvent.press(getByText('Edit'));

    await waitFor(() => {
      expect(getByTestId('inventory-product-form')).toBeTruthy();
      expect(getByText('Edit Product')).toBeTruthy();
    });
  });
});
