import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ApiError } from '../../../api/client';
import type {
  InventoryCategory,
  InventoryProduct,
  InventoryTax,
  InventoryWarehouse,
} from '../../../api/modules/inventory';
import {
  ActionSheet,
  type ActionSheetAction,
  AppBadge,
  AppButton,
  AppCard,
  AppChip,
  AppDatePicker,
  AppHeader,
  AppInput,
  AppListItem,
  AppScreen,
  AppSection,
  AppSelect,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  DotBadge,
  EmptyState,
  ErrorState,
  FilterBar,
  FormValidationProvider,
  FormField,
  HeaderIconButton,
  HeaderMenuButton,
  ListRow,
  PaginationFooter,
  PillTabs,
  PullToRefreshContainer,
  SearchBar,
  SectionHeader,
  Skeleton,
  StatStrip,
  SystemHeaderActions,
  type QuickAction,
  type SelectOption,
  UnderlineTabs,
  useFormValidation,
  useToast,
} from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { useModuleActionPermissions } from '../../../hooks/useModuleActionPermissions';
import { palette, spacing, typography } from '../../../theme/tokens';
import {
  INVENTORY_STATUS_OPTIONS,
  normalizeStatus,
  parseOptionalNumber,
  ROW_STATUS_OPTIONS,
  toCategoryFormValues,
  toTaxFormValues,
  toWarehouseFormValues,
  type CategoryFormValues,
  type InventoryFormMode,
  type InventoryStatusFilter,
  type InventoryTab,
  type TaxFormValues,
  type WarehouseFormValues,
} from '../contracts';
import {
  ACTIVE_INGREDIENT_OPTIONS,
  buildProductPayload,
  clearRegulatoryAgronomicFields,
  createEmptyCropGuidanceRow,
  createEmptyInventoryRecord,
  createEmptyProductFormValues,
  deriveTargetOrganismsFromIngredients,
  getVisibleProductSteps,
  isPesticideFamilyProductType,
  PRODUCT_DOSE_UNIT_OPTIONS,
  PRODUCT_FORM_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  PRODUCT_USAGE_TYPE_OPTIONS,
  toProductFormValues,
  validateProductFormValues,
  type ProductFormValues,
  type ProductValidationErrors,
  type ProductWizardStep,
} from '../product-form';
import { buildCategoryRowSubtitle } from '../categoryPresentation';
import {
  buildProductRowSubtitle,
  formatInventoryStatusLabel,
  isInventoryInactiveStatus,
  toInventoryRowIconVariant,
  toInventoryStatusBadgeVariant,
  toProductIcon,
} from '../productPresentation';
import { buildTaxRowSubtitle } from '../taxPresentation';
import {
  buildWarehouseRowSubtitle,
} from '../warehousePresentation';
import { CategoryFormSheet } from './components/CategoryFormSheet.component';
import { InventoryCategoryDetailSheet } from './components/InventoryCategoryDetailSheet.component';
import { InventoryProductDetailSheet } from './components/InventoryProductDetailSheet.component';
import { InventorySectionCard } from './components/InventorySectionCard.component';
import { InventoryModuleTabs } from './components/InventoryModuleTabs.component';
import { InventoryTaxDetailSheet } from './components/InventoryTaxDetailSheet.component';
import { InventoryWarehouseDetailSheet } from './components/InventoryWarehouseDetailSheet.component';
import { WarehouseFormSheet } from './components/WarehouseFormSheet.component';
import { useInventoryModule } from '../useInventoryModule.hook';

type ActionTarget =
  | { type: 'category'; item: InventoryCategory }
  | { type: 'tax'; item: InventoryTax }
  | { type: 'warehouse'; item: InventoryWarehouse }
  | { type: 'product'; item: InventoryProduct };

type ConfirmTarget =
  | { type: 'category-status'; item: InventoryCategory; nextStatus: 'active' | 'inactive' }
  | { type: 'tax-status'; item: InventoryTax; nextStatus: 'active' | 'inactive' }
  | { type: 'warehouse-status'; item: InventoryWarehouse; nextStatus: 'active' | 'inactive' }
  | { type: 'product-status'; item: InventoryProduct; nextStatus: 'active' | 'inactive' };

type ProductContactQuickAddKind = 'supplier' | 'manufacturer';

type ProductCategoryQuickAddValues = {
  name: string;
  parentId: string;
  displayOnStorefront: boolean;
  notes: string;
  imageUrl: string;
};

type ProductTaxQuickAddValues = {
  name: string;
  rate: string;
  notes: string;
};

type ProductContactQuickAddValues = {
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  cityRegion: string;
  taxId: string;
  notes: string;
};

type ProductWarehouseQuickAddValues = {
  name: string;
  fieldId: string;
  notes: string;
};

type CategoryFormField = 'name';
type TaxFormField = 'name' | 'rate';
type WarehouseFormField = 'name' | 'fieldId';
type ProductFormField =
  | 'name'
  | 'productType'
  | 'usageType'
  | 'doseUnitOtherText'
  | 'phiMaxDays';
type ProductCategoryQuickAddField = 'name';
type ProductTaxQuickAddField = 'name' | 'rate';
type ProductContactQuickAddField = 'name';
type ProductWarehouseQuickAddField = 'name' | 'fieldId';

function isInactiveStatus(status: string): boolean {
  return isInventoryInactiveStatus(status);
}

function toStatusBadgeVariant(status: string): 'success' | 'warning' {
  return isInactiveStatus(status) ? 'warning' : 'success';
}

function toEntityLabel(tab: InventoryTab): string {
  switch (tab) {
    case 'categories':
      return 'Category';
    case 'taxes':
      return 'Tax';
    case 'warehouses':
      return 'Warehouse';
    default:
      return 'Product';
  }
}

function toYesNo(value: boolean): 'yes' | 'no' {
  return value ? 'yes' : 'no';
}

export function InventoryScreen() {
  const { t } = useAppI18n();
  const { showToast } = useToast();
  const { loading: permissionsLoading, permissions: modulePermissions } =
    useModuleActionPermissions('inventory');
  const {
    categories,
    taxes,
    warehouses,
    products,
    fieldOptions,
    supplierOptions,
    manufacturerOptions,
    cropOptions,
    counts,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    createCategory,
    updateCategory,
    createTax,
    updateTax,
    createWarehouse,
    updateWarehouse,
    createProduct,
    updateProduct,
    enableStorefrontForActiveCategories,
    createFieldOption,
    createSupplierOption,
    createManufacturerOption,
  } = useInventoryModule();

  const [activeTab, setActiveTab] = useState<InventoryTab>('products');
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>('active');
  const [warehouseFieldFilter, setWarehouseFieldFilter] = useState('all');
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);
  const [selectedTax, setSelectedTax] = useState<InventoryTax | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<InventoryWarehouse | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [bulkCategoryActionLoading, setBulkCategoryActionLoading] = useState(false);

  const [categoryFormVisible, setCategoryFormVisible] = useState(false);
  const [categoryFormMode, setCategoryFormMode] = useState<InventoryFormMode>('create');
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [categoryFormValues, setCategoryFormValues] = useState<CategoryFormValues>(
    toCategoryFormValues(),
  );

  const [taxFormVisible, setTaxFormVisible] = useState(false);
  const [taxFormMode, setTaxFormMode] = useState<InventoryFormMode>('create');
  const [editingTax, setEditingTax] = useState<InventoryTax | null>(null);
  const [taxFormValues, setTaxFormValues] = useState<TaxFormValues>(toTaxFormValues());

  const [warehouseFormVisible, setWarehouseFormVisible] = useState(false);
  const [warehouseFormMode, setWarehouseFormMode] = useState<InventoryFormMode>('create');
  const [editingWarehouse, setEditingWarehouse] = useState<InventoryWarehouse | null>(null);
  const [warehouseFormValues, setWarehouseFormValues] = useState<WarehouseFormValues>(
    toWarehouseFormValues(),
  );

  const [productFormVisible, setProductFormVisible] = useState(false);
  const [productFormMode, setProductFormMode] = useState<InventoryFormMode>('create');
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [productFormValues, setProductFormValues] = useState<ProductFormValues>(
    toProductFormValues(),
  );
  const [productWizardStep, setProductWizardStep] = useState<ProductWizardStep>('a');
  const [productFormErrors, setProductFormErrors] = useState<ProductValidationErrors>({});
  const [activeIngredientDraft, setActiveIngredientDraft] = useState('');
  const [referenceUrlDraft, setReferenceUrlDraft] = useState('');
  const [cropReferenceDrafts, setCropReferenceDrafts] = useState<Record<number, string>>({});
  const [imageUrlDraft, setImageUrlDraft] = useState('');

  const [productCategoryQuickAddVisible, setProductCategoryQuickAddVisible] = useState(false);
  const [productTaxQuickAddVisible, setProductTaxQuickAddVisible] = useState(false);
  const [productContactQuickAddVisible, setProductContactQuickAddVisible] = useState(false);
  const [productWarehouseQuickAddVisible, setProductWarehouseQuickAddVisible] = useState(false);
  const [productContactQuickAddKind, setProductContactQuickAddKind] =
    useState<ProductContactQuickAddKind>('supplier');
  const [warehouseQuickAddTargetIndex, setWarehouseQuickAddTargetIndex] = useState<number | null>(
    null,
  );

  const [productCategoryQuickAddValues, setProductCategoryQuickAddValues] =
    useState<ProductCategoryQuickAddValues>({
      name: '',
      parentId: '',
      displayOnStorefront: false,
      notes: '',
      imageUrl: '',
    });
  const [productTaxQuickAddValues, setProductTaxQuickAddValues] = useState<ProductTaxQuickAddValues>({
    name: '',
    rate: '0',
    notes: '',
  });
  const [productContactQuickAddValues, setProductContactQuickAddValues] =
    useState<ProductContactQuickAddValues>({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      country: '',
      cityRegion: '',
      taxId: '',
      notes: '',
    });
  const [productWarehouseQuickAddValues, setProductWarehouseQuickAddValues] =
    useState<ProductWarehouseQuickAddValues>({
      name: '',
      fieldId: '',
      notes: '',
    });
  const categoryFormScrollRef = useRef<ScrollView | null>(null);
  const taxFormScrollRef = useRef<ScrollView | null>(null);
  const warehouseFormScrollRef = useRef<ScrollView | null>(null);
  const productFormScrollRef = useRef<ScrollView | null>(null);
  const productCategoryQuickAddScrollRef = useRef<ScrollView | null>(null);
  const productTaxQuickAddScrollRef = useRef<ScrollView | null>(null);
  const productContactQuickAddScrollRef = useRef<ScrollView | null>(null);
  const productWarehouseQuickAddScrollRef = useRef<ScrollView | null>(null);
  const categoryFormValidation = useFormValidation<CategoryFormField>(categoryFormScrollRef);
  const taxFormValidation = useFormValidation<TaxFormField>(taxFormScrollRef);
  const warehouseFormValidation =
    useFormValidation<WarehouseFormField>(warehouseFormScrollRef);
  const productFormValidation = useFormValidation<ProductFormField>(productFormScrollRef);
  const productCategoryQuickAddValidation =
    useFormValidation<ProductCategoryQuickAddField>(productCategoryQuickAddScrollRef);
  const productTaxQuickAddValidation =
    useFormValidation<ProductTaxQuickAddField>(productTaxQuickAddScrollRef);
  const productContactQuickAddValidation =
    useFormValidation<ProductContactQuickAddField>(productContactQuickAddScrollRef);
  const productWarehouseQuickAddValidation =
    useFormValidation<ProductWarehouseQuickAddField>(productWarehouseQuickAddScrollRef);

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ label: item.name, value: item.id })),
    [categories],
  );
  const taxOptions = useMemo(
    () => taxes.map((item) => ({ label: `${item.name} (${item.rate}%)`, value: item.id })),
    [taxes],
  );
  const supplierSelectOptions = useMemo<SelectOption[]>(
    () => supplierOptions.map((item) => ({ label: item.name, value: item.id })),
    [supplierOptions],
  );
  const manufacturerSelectOptions = useMemo<SelectOption[]>(
    () => manufacturerOptions.map((item) => ({ label: item.name, value: item.id })),
    [manufacturerOptions],
  );
  const categoryLabelById = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );
  const taxLabelById = useMemo(
    () => new Map(taxes.map((item) => [item.id, item.name])),
    [taxes],
  );
  const supplierLabelById = useMemo(
    () => new Map(supplierOptions.map((item) => [item.id, item.name])),
    [supplierOptions],
  );
  const fieldLabelById = useMemo(
    () => new Map(fieldOptions.map((item) => [item.value, item.label])),
    [fieldOptions],
  );
  const manufacturerLabelById = useMemo(
    () => new Map(manufacturerOptions.map((item) => [item.id, item.name])),
    [manufacturerOptions],
  );
  const cropSelectOptions = useMemo<SelectOption[]>(
    () => cropOptions.map((item) => ({ label: item.name, value: item.id })),
    [cropOptions],
  );
  const visibleProductSteps = useMemo(
    () => getVisibleProductSteps(productFormValues.productType),
    [productFormValues.productType],
  );
  const productStepOptions = useMemo(
    () =>
      visibleProductSteps.map((step) => ({
        value: step,
        label:
          step === 'a'
            ? 'A: Basic Info'
            : step === 'b'
              ? 'B: Regulatory'
              : isPesticideFamilyProductType(productFormValues.productType)
                ? 'C: Pricing & Stock'
                : 'B: Pricing & Stock',
      })),
    [productFormValues.productType, visibleProductSteps],
  );
  const activeIngredientSelectOptions = useMemo<SelectOption[]>(
    () => ACTIVE_INGREDIENT_OPTIONS.map((value) => ({ label: value, value })),
    [],
  );
  const isAnyProductQuickAddVisible =
    productCategoryQuickAddVisible ||
    productTaxQuickAddVisible ||
    productContactQuickAddVisible ||
    productWarehouseQuickAddVisible;

  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    return categories.filter((item) => {
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'inactive' ? isInactiveStatus(item.status) : !isInactiveStatus(item.status));
      if (!statusMatches) return false;
      if (!normalizedSearch) return true;
      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        (item.notes ?? '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [categories, normalizedSearch, statusFilter]);

  const activeCategoriesCount = useMemo(
    () => categories.filter((item) => !isInactiveStatus(item.status)).length,
    [categories],
  );
  const inactiveCategoriesCount = useMemo(
    () => categories.filter((item) => isInactiveStatus(item.status)).length,
    [categories],
  );
  const storefrontCategoriesCount = useMemo(
    () => categories.filter((item) => item.displayOnStorefront).length,
    [categories],
  );

  const filteredTaxes = useMemo(() => {
    return taxes.filter((item) => {
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'inactive' ? isInactiveStatus(item.status) : !isInactiveStatus(item.status));
      if (!statusMatches) return false;
      if (!normalizedSearch) return true;
      return item.name.toLowerCase().includes(normalizedSearch);
    });
  }, [taxes, normalizedSearch, statusFilter]);

  const activeTaxesCount = useMemo(
    () => taxes.filter((item) => !isInactiveStatus(item.status)).length,
    [taxes],
  );
  const inactiveTaxesCount = useMemo(
    () => taxes.filter((item) => isInactiveStatus(item.status)).length,
    [taxes],
  );

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((item) => {
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'inactive' ? isInactiveStatus(item.status) : !isInactiveStatus(item.status));
      if (!statusMatches) return false;
      if (warehouseFieldFilter !== 'all' && item.fieldId !== warehouseFieldFilter) return false;
      if (!normalizedSearch) return true;
      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        (item.notes ?? '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [warehouses, normalizedSearch, statusFilter, warehouseFieldFilter]);

  const activeWarehousesCount = useMemo(
    () => warehouses.filter((item) => !isInactiveStatus(item.status)).length,
    [warehouses],
  );
  const inactiveWarehousesCount = useMemo(
    () => warehouses.filter((item) => isInactiveStatus(item.status)).length,
    [warehouses],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'inactive' ? isInactiveStatus(item.status) : !isInactiveStatus(item.status));
      if (!statusMatches) return false;
      if (!normalizedSearch) return true;
      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        (item.sku ?? '').toLowerCase().includes(normalizedSearch) ||
        (item.unit ?? '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [products, normalizedSearch, statusFilter]);

  const activeProductsCount = useMemo(
    () => products.filter((item) => !isInactiveStatus(item.status)).length,
    [products],
  );
  const inactiveProductsCount = useMemo(
    () => products.filter((item) => isInactiveStatus(item.status)).length,
    [products],
  );
  const storefrontProductsCount = useMemo(
    () => products.filter((item) => item.displayOnStorefront).length,
    [products],
  );

  useEffect(() => {
    if (!visibleProductSteps.includes(productWizardStep)) {
      setProductWizardStep(visibleProductSteps[visibleProductSteps.length - 1] ?? 'a');
    }
  }, [productWizardStep, visibleProductSteps]);

  useEffect(() => {
    if (!isPesticideFamilyProductType(productFormValues.productType)) return;

    const derivedTargets = deriveTargetOrganismsFromIngredients(productFormValues.activeIngredients);
    if (derivedTargets === productFormValues.targetOrganismsText) return;
    setProductFormValues((prev) => ({ ...prev, targetOrganismsText: derivedTargets }));
  }, [
    productFormValues.activeIngredients,
    productFormValues.productType,
    productFormValues.targetOrganismsText,
  ]);

  useEffect(() => {
    if (!productFormValues.manufacturerId) return;
    if (productFormValues.manufacturer.trim().length > 0) return;

    const match = manufacturerSelectOptions.find(
      (option) => option.value === productFormValues.manufacturerId,
    );
    if (!match) return;

    setProductFormValues((prev) => ({
      ...prev,
      manufacturer: match.label,
    }));
  }, [
    manufacturerSelectOptions,
    productFormValues.manufacturer,
    productFormValues.manufacturerId,
  ]);

  useEffect(() => {
    if (warehouseFieldFilter === 'all') return;
    if (fieldOptions.some((option) => option.value === warehouseFieldFilter)) return;
    setWarehouseFieldFilter('all');
  }, [fieldOptions, warehouseFieldFilter]);

  useEffect(() => {
    if (!selectedProduct) return;

    const match = products.find((item) => item.id === selectedProduct.id) ?? null;
    if (!match) {
      setSelectedProduct(null);
      return;
    }

    if (match !== selectedProduct) {
      setSelectedProduct(match);
    }
  }, [products, selectedProduct]);

  useEffect(() => {
    if (activeTab === 'products') return;
    setSelectedProduct(null);
  }, [activeTab]);

  useEffect(() => {
    if (!selectedCategory) return;

    const match = categories.find((item) => item.id === selectedCategory.id) ?? null;
    if (!match) {
      setSelectedCategory(null);
      return;
    }

    if (match !== selectedCategory) {
      setSelectedCategory(match);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (activeTab === 'categories') return;
    setSelectedCategory(null);
  }, [activeTab]);

  useEffect(() => {
    if (!selectedTax) return;

    const match = taxes.find((item) => item.id === selectedTax.id) ?? null;
    if (!match) {
      setSelectedTax(null);
      return;
    }

    if (match !== selectedTax) {
      setSelectedTax(match);
    }
  }, [selectedTax, taxes]);

  useEffect(() => {
    if (activeTab === 'taxes') return;
    setSelectedTax(null);
  }, [activeTab]);

  useEffect(() => {
    if (!selectedWarehouse) return;

    const match = warehouses.find((item) => item.id === selectedWarehouse.id) ?? null;
    if (!match) {
      setSelectedWarehouse(null);
      return;
    }

    if (match !== selectedWarehouse) {
      setSelectedWarehouse(match);
    }
  }, [selectedWarehouse, warehouses]);

  useEffect(() => {
    if (activeTab === 'warehouses') return;
    setSelectedWarehouse(null);
  }, [activeTab]);

  function getFirstProductErrorStep(errors: ProductValidationErrors): ProductWizardStep {
    if (errors.name || errors.productType || errors.usageType) return 'a';
    return 'b';
  }

  function getProductValidationRules(
    errors: ProductValidationErrors,
    step: ProductWizardStep,
  ) {
    if (step === 'a') {
      return [
        {
          field: 'name' as const,
          message: errors.name ?? 'Product name is required.',
          isValid: !errors.name,
        },
        {
          field: 'productType' as const,
          message: errors.productType ?? 'Product type is required.',
          isValid: !errors.productType,
        },
        {
          field: 'usageType' as const,
          message: errors.usageType ?? 'Usage type is required.',
          isValid: !errors.usageType,
        },
      ];
    }

    return [
      {
        field: 'doseUnitOtherText' as const,
        message:
          errors.doseUnitOtherText ??
          'Dose unit text is required when dose unit is "other".',
        isValid: !errors.doseUnitOtherText,
      },
      {
        field: 'phiMaxDays' as const,
        message: errors.phiMaxDays ?? 'PHI max days must be greater than or equal to PHI min days.',
        isValid: !errors.phiMaxDays,
      },
    ];
  }

  function clearProductValidationError(field: ProductFormField) {
    productFormValidation.clearFieldError(field);
    setProductFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function applyProductValidation(errors: ProductValidationErrors) {
    setProductFormErrors(errors);
    const step = getFirstProductErrorStep(errors);
    setProductWizardStep(step);
    setTimeout(() => {
      productFormValidation.validate(getProductValidationRules(errors, step));
    }, 0);
  }

  function handleProductTypeChange(value: string) {
    setProductFormValues((prev) => {
      const next = { ...prev, productType: value };
      if (isPesticideFamilyProductType(prev.productType) && !isPesticideFamilyProductType(value)) {
        return clearRegulatoryAgronomicFields(next);
      }
      return next;
    });
  }

  function updateProductUsageType(value: string) {
    setProductFormValues((prev) => ({
      ...prev,
      usageType: value === 'Selling' || value === 'FarmInput' || value === 'Both' ? value : 'Both',
      displayOnStorefront:
        value === 'FarmInput'
          ? false
          : prev.displayOnStorefront,
    }));
  }

  function addReferenceUrlToProduct() {
    const candidate = referenceUrlDraft.trim();
    if (!candidate) return;

    setProductFormValues((prev) => ({
      ...prev,
      referenceUrls: [...prev.referenceUrls, candidate],
    }));
    setReferenceUrlDraft('');
  }

  function addImageUrl() {
    const candidate = imageUrlDraft.trim();
    if (!candidate) return;
    setProductFormValues((prev) => ({
      ...prev,
      imagesNew: [...prev.imagesNew, candidate],
    }));
    setImageUrlDraft('');
  }

  function addCropReferenceUrl(rowIndex: number) {
    const candidate = (cropReferenceDrafts[rowIndex] ?? '').trim();
    if (!candidate) return;

    setProductFormValues((prev) => ({
      ...prev,
      cropGuidanceRows: prev.cropGuidanceRows.map((row, index) =>
        index === rowIndex
          ? { ...row, referenceUrls: [...row.referenceUrls, candidate] }
          : row,
      ),
    }));
    setCropReferenceDrafts((prev) => ({ ...prev, [rowIndex]: '' }));
  }

  function updateCropRow(
    index: number,
    patch: Partial<ProductFormValues['cropGuidanceRows'][number]>,
  ) {
    setProductFormValues((prev) => ({
      ...prev,
      cropGuidanceRows: prev.cropGuidanceRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    }));
  }

  function goToNextProductStep() {
    const currentIndex = visibleProductSteps.indexOf(productWizardStep);
    const nextStep = visibleProductSteps[currentIndex + 1];
    if (!nextStep) return;

    if (productWizardStep === 'a' || productWizardStep === 'b') {
      const errors = validateProductFormValues(productFormValues);
      const stepErrors =
        productWizardStep === 'a'
          ? Object.fromEntries(
              Object.entries(errors).filter(([key]) =>
                ['name', 'productType', 'usageType'].includes(key),
              ),
            )
          : Object.fromEntries(
              Object.entries(errors).filter(([key]) =>
                ['doseUnitOtherText', 'phiMaxDays'].includes(key),
              ),
            );

      if (Object.keys(stepErrors).length > 0) {
        setProductFormErrors((prev) => ({ ...prev, ...stepErrors }));
        productFormValidation.validate(getProductValidationRules(stepErrors, productWizardStep));
        showToast({ message: 'Resolve validation errors before continuing.', variant: 'error' });
        return;
      }
    }

    setProductWizardStep(nextStep);
  }

  function goToPreviousProductStep() {
    const currentIndex = visibleProductSteps.indexOf(productWizardStep);
    const previousStep = visibleProductSteps[currentIndex - 1];
    if (!previousStep) return;
    setProductWizardStep(previousStep);
  }

  function openCreateSheet() {
    if (permissionsLoading || !modulePermissions.add) {
      showToast({ message: 'You do not have permission to create records in this module.', variant: 'error' });
      return;
    }

    if (activeTab === 'categories') {
      setCategoryFormMode('create');
      setEditingCategory(null);
      setCategoryFormValues(toCategoryFormValues());
      categoryFormValidation.reset();
      setCategoryFormVisible(true);
      return;
    }

    if (activeTab === 'taxes') {
      setTaxFormMode('create');
      setEditingTax(null);
      setTaxFormValues(toTaxFormValues());
      taxFormValidation.reset();
      setTaxFormVisible(true);
      return;
    }

    if (activeTab === 'warehouses') {
      setWarehouseFormMode('create');
      setEditingWarehouse(null);
      setWarehouseFormValues(toWarehouseFormValues());
      warehouseFormValidation.reset();
      setWarehouseFormVisible(true);
      return;
    }

    setProductFormMode('create');
    setEditingProduct(null);
    setProductFormValues(createEmptyProductFormValues());
    setProductWizardStep('a');
    setProductFormErrors({});
    setActiveIngredientDraft('');
    setReferenceUrlDraft('');
    setCropReferenceDrafts({});
    setImageUrlDraft('');
    productFormValidation.reset();
    setProductFormVisible(true);
  }

  function openEditSheet(target: ActionTarget) {
    if (permissionsLoading || !modulePermissions.edit) {
      showToast({ message: 'You do not have permission to edit records in this module.', variant: 'error' });
      return;
    }

    if (target.type === 'category') {
      setCategoryFormMode('edit');
      setEditingCategory(target.item);
      setCategoryFormValues(toCategoryFormValues(target.item));
      categoryFormValidation.reset();
      setCategoryFormVisible(true);
      return;
    }

    if (target.type === 'tax') {
      setTaxFormMode('edit');
      setEditingTax(target.item);
      setTaxFormValues(toTaxFormValues(target.item));
      taxFormValidation.reset();
      setTaxFormVisible(true);
      return;
    }

    if (target.type === 'warehouse') {
      setWarehouseFormMode('edit');
      setEditingWarehouse(target.item);
      setWarehouseFormValues(toWarehouseFormValues(target.item));
      warehouseFormValidation.reset();
      setWarehouseFormVisible(true);
      return;
    }

    setProductFormMode('edit');
    setEditingProduct(target.item);
    setProductFormValues(toProductFormValues(target.item));
    setProductWizardStep('a');
    setProductFormErrors({});
    setActiveIngredientDraft('');
    setReferenceUrlDraft('');
    setCropReferenceDrafts({});
    setImageUrlDraft('');
    productFormValidation.reset();
    setProductFormVisible(true);
  }

  function openProductDetails(product: InventoryProduct) {
    setSelectedProduct(product);
  }

  function closeProductDetails() {
    setSelectedProduct(null);
  }

  function openCategoryDetails(category: InventoryCategory) {
    setSelectedCategory(category);
  }

  function closeCategoryDetails() {
    setSelectedCategory(null);
  }

  function openEditCategorySheet(category: InventoryCategory) {
    closeCategoryDetails();
    openEditSheet({ type: 'category', item: category });
  }

  function openTaxDetails(tax: InventoryTax) {
    setSelectedTax(tax);
  }

  function closeTaxDetails() {
    setSelectedTax(null);
  }

  function openEditTaxSheet(tax: InventoryTax) {
    closeTaxDetails();
    openEditSheet({ type: 'tax', item: tax });
  }

  function openWarehouseDetails(warehouse: InventoryWarehouse) {
    setSelectedWarehouse(warehouse);
  }

  function closeWarehouseDetails() {
    setSelectedWarehouse(null);
  }

  function openEditWarehouseSheet(warehouse: InventoryWarehouse) {
    closeWarehouseDetails();
    openEditSheet({ type: 'warehouse', item: warehouse });
  }

  function openEditProductSheet(product: InventoryProduct) {
    closeProductDetails();
    openEditSheet({ type: 'product', item: product });
  }

  function closeCategorySheet() {
    setCategoryFormVisible(false);
    setEditingCategory(null);
    setCategoryFormValues(toCategoryFormValues());
    categoryFormValidation.reset();
  }

  function closeTaxSheet() {
    setTaxFormVisible(false);
    setEditingTax(null);
    setTaxFormValues(toTaxFormValues());
    taxFormValidation.reset();
  }

  function closeWarehouseSheet() {
    setWarehouseFormVisible(false);
    setEditingWarehouse(null);
    setWarehouseFormValues(toWarehouseFormValues());
    warehouseFormValidation.reset();
  }

  function closeProductSheet() {
    setProductFormVisible(false);
    setEditingProduct(null);
    setProductFormValues(createEmptyProductFormValues());
    setProductWizardStep('a');
    setProductFormErrors({});
    setActiveIngredientDraft('');
    setReferenceUrlDraft('');
    setCropReferenceDrafts({});
    setImageUrlDraft('');
    productFormValidation.reset();
    setProductCategoryQuickAddVisible(false);
    setProductTaxQuickAddVisible(false);
    setProductContactQuickAddVisible(false);
    setProductWarehouseQuickAddVisible(false);
    productCategoryQuickAddValidation.reset();
    productTaxQuickAddValidation.reset();
    productContactQuickAddValidation.reset();
    productWarehouseQuickAddValidation.reset();
    setWarehouseQuickAddTargetIndex(null);
    setProductCategoryQuickAddValues({
      name: '',
      parentId: '',
      displayOnStorefront: false,
      notes: '',
      imageUrl: '',
    });
    setProductTaxQuickAddValues({
      name: '',
      rate: '0',
      notes: '',
    });
    setProductContactQuickAddValues({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      country: '',
      cityRegion: '',
      taxId: '',
      notes: '',
    });
    setProductWarehouseQuickAddValues({
      name: '',
      fieldId: '',
      notes: '',
    });
  }

  function handleProductSheetDismiss() {
    if (isAnyProductQuickAddVisible) {
      showToast({
        message: 'Close the active Quick Add sheet before dismissing the product form.',
        variant: 'info',
      });
      return;
    }
    closeProductSheet();
  }

  function openProductCategoryQuickAdd() {
    if (permissionsLoading || !modulePermissions.add) {
      showToast({ message: 'You do not have permission to create categories.', variant: 'error' });
      return;
    }
    productCategoryQuickAddValidation.reset();
    setProductCategoryQuickAddVisible(true);
  }

  function openProductTaxQuickAdd() {
    if (permissionsLoading || !modulePermissions.add) {
      showToast({ message: 'You do not have permission to create taxes.', variant: 'error' });
      return;
    }
    productTaxQuickAddValidation.reset();
    setProductTaxQuickAddVisible(true);
  }

  function openProductContactQuickAdd(kind: ProductContactQuickAddKind) {
    if (permissionsLoading || !modulePermissions.add) {
      showToast({ message: `You do not have permission to create ${kind} contacts.`, variant: 'error' });
      return;
    }
    setProductContactQuickAddKind(kind);
    productContactQuickAddValidation.reset();
    setProductContactQuickAddVisible(true);
  }

  function openProductWarehouseQuickAdd(targetIndex: number) {
    if (permissionsLoading || !modulePermissions.add) {
      showToast({ message: 'You do not have permission to create warehouses.', variant: 'error' });
      return;
    }
    productWarehouseQuickAddValidation.reset();
    setWarehouseQuickAddTargetIndex(targetIndex);
    setProductWarehouseQuickAddVisible(true);
  }

  function closeProductCategoryQuickAdd() {
    setProductCategoryQuickAddVisible(false);
    productCategoryQuickAddValidation.reset();
    setProductCategoryQuickAddValues({
      name: '',
      parentId: '',
      displayOnStorefront: false,
      notes: '',
      imageUrl: '',
    });
  }

  function closeProductTaxQuickAdd() {
    setProductTaxQuickAddVisible(false);
    productTaxQuickAddValidation.reset();
    setProductTaxQuickAddValues({
      name: '',
      rate: '0',
      notes: '',
    });
  }

  function closeProductContactQuickAdd() {
    setProductContactQuickAddVisible(false);
    productContactQuickAddValidation.reset();
    setProductContactQuickAddValues({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      country: '',
      cityRegion: '',
      taxId: '',
      notes: '',
    });
  }

  function closeProductWarehouseQuickAdd() {
    setProductWarehouseQuickAddVisible(false);
    productWarehouseQuickAddValidation.reset();
    setWarehouseQuickAddTargetIndex(null);
    setProductWarehouseQuickAddValues({
      name: '',
      fieldId: '',
      notes: '',
    });
  }

  async function submitProductCategoryQuickAdd() {
    const name = productCategoryQuickAddValues.name.trim();
    const valid = productCategoryQuickAddValidation.validate([
      {
        field: 'name',
        message: 'Category name is required.',
        isValid: name.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    try {
      const created = await createCategory({
        name,
        parent_id: productCategoryQuickAddValues.parentId.trim() || null,
        display_on_storefront: productCategoryQuickAddValues.displayOnStorefront,
        notes: productCategoryQuickAddValues.notes.trim() || null,
        image_url: productCategoryQuickAddValues.imageUrl.trim() || null,
      });

      setProductFormValues((prev) => ({
        ...prev,
        categoryId: created.id,
      }));
      closeProductCategoryQuickAdd();
      showToast({ message: `Category ${created.name} created and selected.`, variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitProductTaxQuickAdd() {
    const name = productTaxQuickAddValues.name.trim();
    const rate = parseOptionalNumber(productTaxQuickAddValues.rate);
    const valid = productTaxQuickAddValidation.validate([
      {
        field: 'name',
        message: 'Tax name is required.',
        isValid: name.length > 0,
      },
      {
        field: 'rate',
        message: 'Enter a valid tax rate.',
        isValid: rate !== undefined,
      },
    ]);
    if (!valid || rate === undefined) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    try {
      const created = await createTax({
        name,
        rate,
        notes: productTaxQuickAddValues.notes.trim() || null,
        status: 'active',
      });
      setProductFormValues((prev) => ({
        ...prev,
        taxId: created.id,
      }));
      closeProductTaxQuickAdd();
      showToast({ message: `Tax ${created.name} created and selected.`, variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create tax.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitProductContactQuickAdd() {
    const name = productContactQuickAddValues.name.trim();
    const valid = productContactQuickAddValidation.validate([
      {
        field: 'name',
        message: 'Contact name is required.',
        isValid: name.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    try {
      const createdOption =
        productContactQuickAddKind === 'supplier'
          ? await createSupplierOption({
              name,
              company: productContactQuickAddValues.company.trim() || null,
              phone: productContactQuickAddValues.phone.trim() || null,
              email: productContactQuickAddValues.email.trim() || null,
              address: productContactQuickAddValues.address.trim() || null,
              country: productContactQuickAddValues.country.trim() || null,
              cityRegion: productContactQuickAddValues.cityRegion.trim() || null,
              taxId: productContactQuickAddValues.taxId.trim() || null,
              notes: productContactQuickAddValues.notes.trim() || null,
            })
          : await createManufacturerOption({
              name,
              company: productContactQuickAddValues.company.trim() || null,
              phone: productContactQuickAddValues.phone.trim() || null,
              email: productContactQuickAddValues.email.trim() || null,
              address: productContactQuickAddValues.address.trim() || null,
              country: productContactQuickAddValues.country.trim() || null,
              cityRegion: productContactQuickAddValues.cityRegion.trim() || null,
              taxId: productContactQuickAddValues.taxId.trim() || null,
              notes: productContactQuickAddValues.notes.trim() || null,
            });

      setProductFormValues((prev) => {
        if (productContactQuickAddKind === 'supplier') {
          return {
            ...prev,
            supplierId: createdOption.value,
          };
        }

        return {
          ...prev,
          manufacturerId: createdOption.value,
          manufacturer: createdOption.label,
        };
      });

      closeProductContactQuickAdd();
      showToast({
        message: `${productContactQuickAddKind === 'supplier' ? 'Supplier' : 'Manufacturer'} created and selected.`,
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create contact.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitProductWarehouseQuickAdd() {
    const name = productWarehouseQuickAddValues.name.trim();
    const fieldId = productWarehouseQuickAddValues.fieldId.trim();
    const valid = productWarehouseQuickAddValidation.validate([
      {
        field: 'name',
        message: 'Warehouse name is required.',
        isValid: name.length > 0,
      },
      {
        field: 'fieldId',
        message: 'Field is required.',
        isValid: fieldId.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }
    if (warehouseQuickAddTargetIndex === null) {
      showToast({ message: 'Warehouse target row is missing. Re-open Quick Add from a row.', variant: 'error' });
      return;
    }

    try {
      const created = await createWarehouse({
        name,
        field_id: fieldId,
        status: 'active',
        notes: productWarehouseQuickAddValues.notes.trim() || null,
      });

      setProductFormValues((prev) => ({
        ...prev,
        inventoryRecords: prev.inventoryRecords.map((row, rowIndex) =>
          rowIndex === warehouseQuickAddTargetIndex
            ? { ...row, warehouseId: created.id }
            : row,
        ),
      }));

      closeProductWarehouseQuickAdd();
      showToast({ message: `Warehouse ${created.name} created and selected.`, variant: 'success' });
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 409
          ? 'Warehouse name already exists for this farm. Please use a different name.'
          : error instanceof Error
            ? error.message
            : 'Failed to create warehouse.';
      showToast({ message, variant: 'error' });
    }
  }

  async function handleQuickCreateParentCategory(input: {
    name: string;
    notes: string | null;
  }): Promise<{ id: string; name: string }> {
    if (permissionsLoading || !modulePermissions.add) {
      throw new Error('Missing add permission for category creation.');
    }

    const created = await createCategory({
      name: input.name,
      notes: input.notes,
      display_on_storefront: false,
    });

    return {
      id: created.id,
      name: created.name,
    };
  }

  async function handleQuickCreateFieldOption(input: {
    name: string;
    areaHectares: number;
  }): Promise<SelectOption> {
    if (permissionsLoading || !modulePermissions.add) {
      throw new Error('Missing add permission for field creation.');
    }

    return createFieldOption(input);
  }

  async function submitBulkEnableStorefront() {
    if (permissionsLoading || !modulePermissions.edit) {
      showToast({
        message: 'You do not have permission to update category storefront visibility.',
        variant: 'error',
      });
      return;
    }

    setBulkCategoryActionLoading(true);
    try {
      const updated = await enableStorefrontForActiveCategories();
      showToast({
        message:
          updated > 0
            ? `${updated} active categories now visible on storefront.`
            : 'No active categories required storefront update.',
        variant: updated > 0 ? 'success' : 'info',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to bulk-enable storefront.';
      showToast({ message, variant: 'error' });
    } finally {
      setBulkCategoryActionLoading(false);
    }
  }

  async function submitCategoryForm() {
    const name = categoryFormValues.name.trim();
    const valid = categoryFormValidation.validate([
      {
        field: 'name',
        message: 'Category name is required.',
        isValid: name.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    try {
      if (categoryFormMode === 'create') {
        if (!modulePermissions.add) {
          showToast({ message: 'Add permission is required to create categories.', variant: 'error' });
          return;
        }
        const created = await createCategory({
          name,
          parent_id: categoryFormValues.parentId.trim() || null,
          image_url: categoryFormValues.imageUrl.trim() || null,
          display_on_storefront: categoryFormValues.displayOnStorefront,
          notes: categoryFormValues.notes.trim() || null,
        });

        if (categoryFormValues.status === 'inactive') {
          await updateCategory(created.id, { status: 'inactive' });
        }
        showToast({ message: 'Category created.', variant: 'success' });
      } else if (editingCategory) {
        if (!modulePermissions.edit) {
          showToast({ message: 'Edit permission is required to update categories.', variant: 'error' });
          return;
        }
        await updateCategory(editingCategory.id, {
          name,
          parent_id: categoryFormValues.parentId.trim() || null,
          image_url: categoryFormValues.imageUrl.trim() || null,
          display_on_storefront: categoryFormValues.displayOnStorefront,
          notes: categoryFormValues.notes.trim() || null,
          status: categoryFormValues.status,
        });
        showToast({ message: 'Category updated.', variant: 'success' });
      }
      closeCategorySheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Category mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitTaxForm() {
    const name = taxFormValues.name.trim();
    const rate = parseOptionalNumber(taxFormValues.rate);
    const valid = taxFormValidation.validate([
      {
        field: 'name',
        message: 'Tax name is required.',
        isValid: name.length > 0,
      },
      {
        field: 'rate',
        message: 'Enter a valid tax rate.',
        isValid: rate !== undefined,
      },
    ]);
    if (!valid || rate === undefined) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    try {
      if (taxFormMode === 'create') {
        await createTax({
          name,
          rate,
          notes: taxFormValues.notes.trim() || null,
          status: taxFormValues.status,
        });
        showToast({ message: 'Tax created.', variant: 'success' });
      } else if (editingTax) {
        await updateTax(editingTax.id, {
          name,
          rate,
          notes: taxFormValues.notes.trim() || null,
          status: taxFormValues.status,
        });
        showToast({ message: 'Tax updated.', variant: 'success' });
      }
      closeTaxSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tax mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitWarehouseForm() {
    const name = warehouseFormValues.name.trim();
    const fieldId = warehouseFormValues.fieldId.trim();
    const valid = warehouseFormValidation.validate([
      {
        field: 'name',
        message: 'Warehouse name is required.',
        isValid: name.length > 0,
      },
      {
        field: 'fieldId',
        message: 'Field is required.',
        isValid: fieldId.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const capacityValue = parseOptionalNumber(warehouseFormValues.capacityValue) ?? null;
    const temperatureMin = parseOptionalNumber(warehouseFormValues.temperatureMin) ?? null;
    const temperatureMax = parseOptionalNumber(warehouseFormValues.temperatureMax) ?? null;

    try {
      if (warehouseFormMode === 'create') {
        if (!modulePermissions.add) {
          showToast({ message: 'Add permission is required to create warehouses.', variant: 'error' });
          return;
        }
        await createWarehouse({
          name,
          field_id: fieldId,
          status: warehouseFormValues.status,
          capacity_value: capacityValue,
          capacity_unit: warehouseFormValues.capacityUnit.trim() || null,
          warehouse_types: warehouseFormValues.warehouseTypes,
          temperature_min: temperatureMin,
          temperature_max: temperatureMax,
          safety_measures: warehouseFormValues.safetyMeasures.trim() || null,
          notes: warehouseFormValues.notes.trim() || null,
        });
        showToast({ message: 'Warehouse created.', variant: 'success' });
      } else if (editingWarehouse) {
        if (!modulePermissions.edit) {
          showToast({ message: 'Edit permission is required to update warehouses.', variant: 'error' });
          return;
        }
        await updateWarehouse(editingWarehouse.id, {
          name,
          field_id: fieldId,
          status: warehouseFormValues.status,
          capacity_value: capacityValue,
          capacity_unit: warehouseFormValues.capacityUnit.trim() || null,
          warehouse_types: warehouseFormValues.warehouseTypes,
          temperature_min: temperatureMin,
          temperature_max: temperatureMax,
          safety_measures: warehouseFormValues.safetyMeasures.trim() || null,
          notes: warehouseFormValues.notes.trim() || null,
        });
        showToast({ message: 'Warehouse updated.', variant: 'success' });
      }
      closeWarehouseSheet();
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 409
          ? 'Warehouse name already exists for this farm. Please use a different name.'
          : error instanceof Error
            ? error.message
            : 'Warehouse mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitProductForm() {
    const errors = validateProductFormValues(productFormValues);
    if (Object.keys(errors).length > 0) {
      applyProductValidation(errors);
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const payload = buildProductPayload(productFormValues);

    try {
      if (productFormMode === 'create') {
        await createProduct(payload);
        showToast({ message: 'Product created.', variant: 'success' });
      } else if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        showToast({ message: 'Product updated.', variant: 'success' });
      }
      closeProductSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Product mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitConfirmAction() {
    if (!confirmTarget) return;

    try {
      if (confirmTarget.type === 'category-status') {
        if (confirmTarget.nextStatus === 'inactive' && !modulePermissions.delete) {
          showToast({ message: 'Delete permission is required to deactivate categories.', variant: 'error' });
          return;
        }
        if (confirmTarget.nextStatus === 'active' && !modulePermissions.edit) {
          showToast({ message: 'Edit permission is required to reactivate categories.', variant: 'error' });
          return;
        }
        await updateCategory(confirmTarget.item.id, { status: confirmTarget.nextStatus });
        showToast({
          message: confirmTarget.nextStatus === 'inactive' ? 'Category deactivated.' : 'Category reactivated.',
          variant: 'success',
        });
      }

      if (confirmTarget.type === 'tax-status') {
        await updateTax(confirmTarget.item.id, { status: confirmTarget.nextStatus });
        showToast({
          message: confirmTarget.nextStatus === 'inactive' ? 'Tax deactivated.' : 'Tax reactivated.',
          variant: 'success',
        });
      }

      if (confirmTarget.type === 'warehouse-status') {
        if (confirmTarget.nextStatus === 'inactive' && !modulePermissions.delete) {
          showToast({ message: 'Delete permission is required to deactivate warehouses.', variant: 'error' });
          return;
        }
        if (confirmTarget.nextStatus === 'active' && !modulePermissions.edit) {
          showToast({ message: 'Edit permission is required to reactivate warehouses.', variant: 'error' });
          return;
        }
        await updateWarehouse(confirmTarget.item.id, { status: confirmTarget.nextStatus });
        showToast({
          message:
            confirmTarget.nextStatus === 'inactive'
              ? 'Warehouse deactivated.'
              : 'Warehouse reactivated.',
          variant: 'success',
        });
      }

      if (confirmTarget.type === 'product-status') {
        await updateProduct(confirmTarget.item.id, { status: confirmTarget.nextStatus });
        showToast({
          message: confirmTarget.nextStatus === 'inactive' ? 'Product deactivated.' : 'Product reactivated.',
          variant: 'success',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mutation failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmTarget(null);
    }
  }

  function getActionSheetActions(): ActionSheetAction[] {
    if (!actionTarget) return [];
    const actions: ActionSheetAction[] = [];

    if (modulePermissions.edit) {
      actions.push({
        key: 'edit',
        label: 'Edit',
        onPress: () => {
          openEditSheet(actionTarget);
          setActionTarget(null);
        },
      });
    }

    if (actionTarget.type === 'category') {
      const nextStatus = isInactiveStatus(actionTarget.item.status) ? 'active' : 'inactive';
      const canToggleStatus =
        nextStatus === 'inactive' ? modulePermissions.delete : modulePermissions.edit;
      if (canToggleStatus) {
        actions.push({
          key: 'toggle-status',
          label: nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate',
          onPress: () => {
            setConfirmTarget({
              type: 'category-status',
              item: actionTarget.item,
              nextStatus,
            });
            setActionTarget(null);
          },
        });
      }
      return actions;
    }

    if (actionTarget.type === 'tax') {
      const nextStatus = isInactiveStatus(actionTarget.item.status) ? 'active' : 'inactive';
      actions.push({
        key: 'toggle-status',
        label: nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate',
        onPress: () => {
          setConfirmTarget({
            type: 'tax-status',
            item: actionTarget.item,
            nextStatus,
          });
          setActionTarget(null);
        },
      });
      return actions;
    }

    if (actionTarget.type === 'warehouse') {
      const nextStatus = isInactiveStatus(actionTarget.item.status) ? 'active' : 'inactive';
      const canToggleStatus =
        nextStatus === 'inactive' ? modulePermissions.delete : modulePermissions.edit;
      if (canToggleStatus) {
        actions.push({
          key: 'toggle-status',
          label: nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate',
          onPress: () => {
            setConfirmTarget({
              type: 'warehouse-status',
              item: actionTarget.item,
              nextStatus,
            });
            setActionTarget(null);
          },
        });
      }
      return actions;
    }

    const nextStatus = isInactiveStatus(actionTarget.item.status) ? 'active' : 'inactive';
    actions.push({
      key: 'toggle-status',
      label: nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate',
      onPress: () => {
        setConfirmTarget({
          type: 'product-status',
          item: actionTarget.item,
          nextStatus,
        });
        setActionTarget(null);
      },
    });
    return actions;
  }

  function getProductQuickActions() {
    if (!selectedProduct) return [];

    const actions: QuickAction[] = [];

    if (modulePermissions.edit) {
      actions.push({
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green' as const,
        onPress: () => openEditProductSheet(selectedProduct),
      });
    }

    const nextStatus = isInactiveStatus(selectedProduct.status) ? 'active' : 'inactive';
    actions.push({
      key: 'toggle-status',
      icon: nextStatus === 'inactive' ? 'close-circle-outline' : 'check-circle-outline',
      label: nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate',
      color: nextStatus === 'inactive' ? 'red' : 'green',
      onPress: () =>
        setConfirmTarget({
          type: 'product-status',
          item: selectedProduct,
          nextStatus,
        }),
    });
    return actions;
  }

  function getCategoryQuickActions() {
    if (!selectedCategory) return [];

    const actions: QuickAction[] = [];

    if (modulePermissions.edit) {
      actions.push({
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => openEditCategorySheet(selectedCategory),
      });
    }

    const nextStatus = isInactiveStatus(selectedCategory.status) ? 'active' : 'inactive';
    const canToggleStatus =
      nextStatus === 'inactive' ? modulePermissions.delete : modulePermissions.edit;

    if (canToggleStatus) {
      actions.push({
        key: 'toggle-status',
        icon: nextStatus === 'inactive' ? 'close-circle-outline' : 'check-circle-outline',
        label: nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate',
        color: nextStatus === 'inactive' ? 'red' : 'green',
        onPress: () =>
          setConfirmTarget({
            type: 'category-status',
            item: selectedCategory,
            nextStatus,
          }),
      });
    }

    return actions;
  }

  function getTaxQuickActions() {
    if (!selectedTax) return [];

    const actions: QuickAction[] = [];

    if (modulePermissions.edit) {
      actions.push({
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => openEditTaxSheet(selectedTax),
      });
    }

    actions.push({
      key: 'toggle-status',
      icon: isInactiveStatus(selectedTax.status)
        ? 'check-circle-outline'
        : 'close-circle-outline',
      label: isInactiveStatus(selectedTax.status) ? 'Reactivate' : 'Deactivate',
      color: isInactiveStatus(selectedTax.status) ? 'green' : 'red',
      onPress: () =>
        setConfirmTarget({
          type: 'tax-status',
          item: selectedTax,
          nextStatus: isInactiveStatus(selectedTax.status) ? 'active' : 'inactive',
        }),
    });

    return actions;
  }

  function getWarehouseQuickActions() {
    if (!selectedWarehouse) return [];

    const actions: QuickAction[] = [];

    if (modulePermissions.edit) {
      actions.push({
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => openEditWarehouseSheet(selectedWarehouse),
      });
    }

    const nextStatus = isInactiveStatus(selectedWarehouse.status) ? 'active' : 'inactive';
    const canToggleStatus =
      nextStatus === 'inactive' ? modulePermissions.delete : modulePermissions.edit;

    if (canToggleStatus) {
      actions.push({
        key: 'toggle-status',
        icon: nextStatus === 'inactive' ? 'close-circle-outline' : 'check-circle-outline',
        label: nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate',
        color: nextStatus === 'inactive' ? 'red' : 'green',
        onPress: () =>
          setConfirmTarget({
            type: 'warehouse-status',
            item: selectedWarehouse,
            nextStatus,
          }),
      });
    }

    return actions;
  }

  const activeRowsCount =
    activeTab === 'categories'
      ? filteredCategories.length
      : activeTab === 'taxes'
        ? filteredTaxes.length
        : activeTab === 'warehouses'
          ? filteredWarehouses.length
          : filteredProducts.length;

  const activeTotalCount =
    activeTab === 'categories'
      ? counts.categories
      : activeTab === 'taxes'
        ? counts.taxes
        : activeTab === 'warehouses'
          ? warehouseFieldFilter === 'all'
            ? counts.warehouses
            : filteredWarehouses.length
          : counts.products;

  const actionSheetActions = getActionSheetActions();
  const categoryQuickActions = getCategoryQuickActions();
  const taxQuickActions = getTaxQuickActions();
  const warehouseQuickActions = getWarehouseQuickActions();
  const productQuickActions = getProductQuickActions();

  const inventoryTabs = (
    <InventoryModuleTabs
      value={activeTab}
      onValueChange={setActiveTab}
      testID="inventory-tabs"
    />
  );

  const denseInventoryHeader = (
    <View style={styles.productHeader}>
      <View style={styles.productHeaderTop}>
        <View style={styles.productHeaderLead}>
          <HeaderMenuButton testID="inventory-header-menu" />
          <Text style={styles.productHeaderTitle}>
            {t('system', 'headers.inventory.title', 'Inventory')}
          </Text>
        </View>
        <SystemHeaderActions notificationTestID="inventory-header-notifications">
          {modulePermissions.add ? (
            <HeaderIconButton
              icon="plus"
              onPress={openCreateSheet}
              filled
              testID={
                activeTab === 'categories'
                  ? 'inventory-categories-create'
                  : 'inventory-products-create'
              }
            />
          ) : null}
        </SystemHeaderActions>
      </View>
      <SearchBar
        value={searchValue}
        onChangeText={setSearchValue}
        placeholder={
          activeTab === 'categories'
            ? 'Search categories by name or notes...'
            : 'Search products by name, SKU, or unit...'
        }
      />
      {inventoryTabs}
    </View>
  );

  const legacyInventoryContent = (
    <AppScreen scroll>
      <AppHeader
        title={t('system', 'headers.inventoryLegacy.title', 'Inventory Core')}
        subtitle={t(
          'system',
          'headers.inventoryLegacy.subtitle',
          'Manage products, categories, taxes, and warehouses with reusable module patterns.',
        )}
        rightAction={
          <SystemHeaderActions notificationTestID="inventory-legacy-header-notifications" />
        }
      />

      <InventoryTopActions
        createLabel={`Create ${toEntityLabel(activeTab)}`}
        onCreate={openCreateSheet}
        onRefresh={() => void refresh()}
        loading={isRefreshing || isMutating || permissionsLoading}
      />

      <AppCard>
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder={`Search ${activeTab}`}
        >
          {inventoryTabs}
          <PillTabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as InventoryStatusFilter)}
            tabs={INVENTORY_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
            testID="inventory-status-filter"
          />
        </FilterBar>
      </AppCard>

      <AppCard>
        <AppSection
          title={`${toEntityLabel(activeTab)} records`}
          description={
            activeTab === 'products'
              ? `Canonical list from /products and stock-adjustment list count ${counts.stockAdjustmentProducts}.`
              : `List, create, and update ${activeTab} with shared list/form states.`
          }
        >
          {isLoading ? (
            <>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </>
          ) : errorMessage ? (
            <ErrorState
              message={errorMessage}
              onRetry={() => void refresh()}
            />
          ) : activeRowsCount === 0 ? (
            <EmptyState
              title={`No ${activeTab} found`}
              message="Try another filter or create a new record."
              actionLabel={`Create ${toEntityLabel(activeTab)}`}
              onAction={openCreateSheet}
            />
          ) : (
            <PullToRefreshContainer
              refreshing={isRefreshing}
              onRefresh={() => void refresh()}
            >
              <View style={styles.rows}>
                {activeTab === 'taxes'
                  ? filteredTaxes.map((item) => (
                      <AppCard key={item.id}>
                        <AppListItem
                          title={item.name}
                          description={`Rate ${item.rate}%`}
                          leftIcon="percent"
                          onPress={() => setActionTarget({ type: 'tax', item })}
                        />
                        <View style={styles.rowMeta}>
                          <MetaBadge label="Status" value={item.status} variant={toStatusBadgeVariant(item.status)} />
                          <MetaBadge label="Rate" value={`${item.rate}%`} variant="accent" />
                        </View>
                      </AppCard>
                    ))
                  : null}
                {activeTab === 'products'
                  ? filteredProducts.map((item) => (
                      <AppCard key={item.id}>
                        <AppListItem
                          title={item.name}
                          description={`SKU ${item.sku ?? 'n/a'} • Unit ${item.unit ?? 'n/a'}`}
                          leftIcon="package-variant"
                          onPress={() => setActionTarget({ type: 'product', item })}
                        />
                        <View style={styles.rowMeta}>
                          <MetaBadge label="Status" value={item.status} variant={toStatusBadgeVariant(item.status)} />
                          <MetaBadge
                            label="Price"
                            value={item.pricePerUnit === null ? 'n/a' : item.pricePerUnit.toFixed(2)}
                            variant="accent"
                          />
                          <MetaBadge label="Expiry" value={item.hasExpiry ? 'Yes' : 'No'} variant="neutral" />
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
        totalItems={activeTotalCount}
        onPageChange={() => undefined}
      />
    </AppScreen>
  );

  const productInventoryContent = (
    <AppScreen padded={false}>
      {denseInventoryHeader}

      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView
          style={styles.productScrollView}
          contentContainerStyle={styles.productMain}
          showsVerticalScrollIndicator={false}
        >
          <StatStrip
            items={[
              { value: activeProductsCount, label: 'Active', color: 'green' },
              { value: inactiveProductsCount, label: 'Inactive', color: 'amber' },
              { value: storefrontProductsCount, label: 'Storefront', color: 'green' },
            ]}
            testID="inventory-products-stats"
          />

          <PillTabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as InventoryStatusFilter)}
            tabs={[
              { value: 'all', label: `All (${products.length})` },
              { value: 'active', label: `Active (${activeProductsCount})` },
              { value: 'inactive', label: `Inactive (${inactiveProductsCount})` },
            ]}
            testID="inventory-products-status-filter"
          />

          <SectionHeader title="Products" trailing={`${filteredProducts.length} items`} />

          {isLoading ? (
            <>
              <Skeleton height={68} />
              <Skeleton height={68} />
              <Skeleton height={68} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="No products found"
              message="Try another search or create a new product record."
              actionLabel="Create product"
              onAction={openCreateSheet}
            />
          ) : (
            filteredProducts.map((item) => (
              <ListRow
                key={item.id}
                icon={toProductIcon(item)}
                iconVariant={toInventoryRowIconVariant(item.status)}
                title={item.name}
                subtitle={buildProductRowSubtitle(item)}
                badge={
                  <DotBadge
                    label={formatInventoryStatusLabel(item.status)}
                    variant={toInventoryStatusBadgeVariant(item.status)}
                  />
                }
                onPress={() => openProductDetails(item)}
                testID={`inventory-product-row-${item.id}`}
              />
            ))
          )}
        </ScrollView>
      </PullToRefreshContainer>
    </AppScreen>
  );

  const categoryInventoryContent = (
    <AppScreen padded={false}>
      {denseInventoryHeader}

      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView
          style={styles.productScrollView}
          contentContainerStyle={styles.productMain}
          showsVerticalScrollIndicator={false}
        >
          <StatStrip
            items={[
              { value: activeCategoriesCount, label: 'Active', color: 'green' },
              { value: inactiveCategoriesCount, label: 'Inactive', color: 'amber' },
              { value: storefrontCategoriesCount, label: 'Storefront', color: 'green' },
            ]}
            testID="inventory-categories-stats"
          />

          <PillTabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as InventoryStatusFilter)}
            tabs={[
              { value: 'all', label: `All (${categories.length})` },
              { value: 'active', label: `Active (${activeCategoriesCount})` },
              { value: 'inactive', label: `Inactive (${inactiveCategoriesCount})` },
            ]}
            testID="inventory-categories-status-filter"
          />

          <InventorySectionCard
            title="Storefront Controls"
            description="Bulk enable storefront visibility for every active category."
            trailing={
              <AppButton
                label="Enable Storefront"
                mode="outlined"
                tone="neutral"
                onPress={() => void submitBulkEnableStorefront()}
                loading={bulkCategoryActionLoading}
                disabled={!modulePermissions.edit || bulkCategoryActionLoading}
              />
            }
          >
            <Text style={styles.inlineHint}>
              This keeps category logic unchanged and applies the existing active-category bulk
              action.
            </Text>
          </InventorySectionCard>

          <SectionHeader title="Categories" trailing={`${filteredCategories.length} items`} />

          {isLoading ? (
            <>
              <Skeleton height={68} />
              <Skeleton height={68} />
              <Skeleton height={68} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredCategories.length === 0 ? (
            <EmptyState
              title="No categories found"
              message="Try another search or create a new category record."
              actionLabel="Create category"
              onAction={openCreateSheet}
            />
          ) : (
            filteredCategories.map((item) => (
              <ListRow
                key={item.id}
                icon="shape"
                iconVariant={toInventoryRowIconVariant(item.status)}
                title={item.name}
                subtitle={buildCategoryRowSubtitle({
                  category: item,
                  parentLabel: item.parentId ? categoryLabelById.get(item.parentId) : undefined,
                })}
                badge={
                  <DotBadge
                    label={formatInventoryStatusLabel(item.status)}
                    variant={toInventoryStatusBadgeVariant(item.status)}
                  />
                }
                onPress={() => openCategoryDetails(item)}
                testID={`inventory-category-row-${item.id}`}
              />
            ))
          )}
        </ScrollView>
      </PullToRefreshContainer>
    </AppScreen>
  );

  const taxInventoryContent = (
    <AppScreen padded={false}>
      {denseInventoryHeader}

      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView
          style={styles.productScrollView}
          contentContainerStyle={styles.productMain}
          showsVerticalScrollIndicator={false}
        >
          <StatStrip
            items={[
              { value: activeTaxesCount, label: 'Active', color: 'green' },
              { value: inactiveTaxesCount, label: 'Inactive', color: 'amber' },
              { value: taxes.length, label: 'Total', color: 'green' },
            ]}
            testID="inventory-taxes-stats"
          />

          <PillTabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as InventoryStatusFilter)}
            tabs={[
              { value: 'all', label: `All (${taxes.length})` },
              { value: 'active', label: `Active (${activeTaxesCount})` },
              { value: 'inactive', label: `Inactive (${inactiveTaxesCount})` },
            ]}
            testID="inventory-taxes-status-filter"
          />

          <SectionHeader title="Taxes" trailing={`${filteredTaxes.length} items`} />

          {isLoading ? (
            <>
              <Skeleton height={68} />
              <Skeleton height={68} />
              <Skeleton height={68} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredTaxes.length === 0 ? (
            <EmptyState
              title="No taxes found"
              message="Try another search or create a new tax record."
              actionLabel="Create tax"
              onAction={openCreateSheet}
            />
          ) : (
            filteredTaxes.map((item) => (
              <ListRow
                key={item.id}
                icon="percent"
                iconVariant={toInventoryRowIconVariant(item.status)}
                title={item.name}
                subtitle={buildTaxRowSubtitle(item)}
                badge={
                  <DotBadge
                    label={formatInventoryStatusLabel(item.status)}
                    variant={toInventoryStatusBadgeVariant(item.status)}
                  />
                }
                onPress={() => openTaxDetails(item)}
                testID={`inventory-tax-row-${item.id}`}
              />
            ))
          )}
        </ScrollView>
      </PullToRefreshContainer>
    </AppScreen>
  );

  const warehouseInventoryContent = (
    <AppScreen padded={false}>
      {denseInventoryHeader}

      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView
          style={styles.productScrollView}
          contentContainerStyle={styles.productMain}
          showsVerticalScrollIndicator={false}
        >
          <StatStrip
            items={[
              { value: activeWarehousesCount, label: 'Active', color: 'green' },
              { value: inactiveWarehousesCount, label: 'Inactive', color: 'amber' },
              { value: filteredWarehouses.length, label: 'Filtered', color: 'green' },
            ]}
            testID="inventory-warehouses-stats"
          />

          <PillTabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as InventoryStatusFilter)}
            tabs={[
              { value: 'all', label: `All (${warehouses.length})` },
              { value: 'active', label: `Active (${activeWarehousesCount})` },
              { value: 'inactive', label: `Inactive (${inactiveWarehousesCount})` },
            ]}
            testID="inventory-warehouses-status-filter"
          />

          <InventorySectionCard
            title="Warehouse Field Filter"
            description="Keep the existing farm field filter behavior while using the dense warehouse shell."
          >
            <AppSelect
              label="Field filter"
              value={warehouseFieldFilter}
              onChange={setWarehouseFieldFilter}
              options={[{ label: 'All fields', value: 'all' }, ...fieldOptions]}
              searchable
              testID="inventory-warehouses-field-filter"
            />
          </InventorySectionCard>

          <SectionHeader title="Warehouses" trailing={`${filteredWarehouses.length} items`} />

          {isLoading ? (
            <>
              <Skeleton height={68} />
              <Skeleton height={68} />
              <Skeleton height={68} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredWarehouses.length === 0 ? (
            <EmptyState
              title="No warehouses found"
              message="Try another search or create a new warehouse record."
              actionLabel="Create warehouse"
              onAction={openCreateSheet}
            />
          ) : (
            filteredWarehouses.map((item) => (
              <ListRow
                key={item.id}
                icon="warehouse"
                iconVariant={toInventoryRowIconVariant(item.status)}
                title={item.name}
                subtitle={buildWarehouseRowSubtitle({
                  warehouse: item,
                  fieldLabel: item.fieldId ? fieldLabelById.get(item.fieldId) : undefined,
                })}
                badge={
                  <DotBadge
                    label={formatInventoryStatusLabel(item.status)}
                    variant={toInventoryStatusBadgeVariant(item.status)}
                  />
                }
                onPress={() => openWarehouseDetails(item)}
                testID={`inventory-warehouse-row-${item.id}`}
              />
            ))
          )}
        </ScrollView>
      </PullToRefreshContainer>
    </AppScreen>
  );

  return (
    <>
      {activeTab === 'products'
        ? productInventoryContent
        : activeTab === 'categories'
          ? categoryInventoryContent
          : activeTab === 'taxes'
            ? taxInventoryContent
            : activeTab === 'warehouses'
              ? warehouseInventoryContent
              : legacyInventoryContent}

      <CategoryFormSheet
        visible={categoryFormVisible}
        mode={categoryFormMode}
        values={categoryFormValues}
        categoryOptions={categoryOptions.filter((option) => option.value !== editingCategory?.id)}
        formScrollViewRef={categoryFormScrollRef}
        formValidation={categoryFormValidation}
        loading={isMutating}
        disabled={isMutating}
        onDismiss={closeCategorySheet}
        onSubmit={() => void submitCategoryForm()}
        onChange={setCategoryFormValues}
        onQuickCreateParentCategory={handleQuickCreateParentCategory}
      />

      <BottomSheet
        visible={taxFormVisible}
        onDismiss={closeTaxSheet}
        scrollViewRef={taxFormScrollRef}
        title={taxFormMode === 'create' ? 'Create Tax' : 'Edit Tax'}
        footer={
          <SheetFooter
            onCancel={closeTaxSheet}
            onSubmit={() => void submitTaxForm()}
            submitLabel={taxFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormValidationProvider value={taxFormValidation.providerValue}>
          <InventorySectionCard
            title="Tax Details"
            description="Canonical tax name, rate, status, and optional notes."
          >
            <FormField label="Name" name="name" required>
              <AppInput
                value={taxFormValues.name}
                onChangeText={(value) => {
                  taxFormValidation.clearFieldError('name');
                  setTaxFormValues((prev) => ({ ...prev, name: value }));
                }}
                placeholder="Tax name"
              />
            </FormField>
            <FormField label="Rate %" name="rate" required>
              <AppInput
                value={taxFormValues.rate}
                onChangeText={(value) => {
                  taxFormValidation.clearFieldError('rate');
                  setTaxFormValues((prev) => ({ ...prev, rate: value }));
                }}
                placeholder="16"
              />
            </FormField>
            <FormField label="Status">
              <AppSelect
                value={taxFormValues.status}
                onChange={(value) =>
                  setTaxFormValues((prev) => ({ ...prev, status: normalizeStatus(value) }))
                }
                options={ROW_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
              />
            </FormField>
            <FormField label="Notes">
              <AppTextArea
                value={taxFormValues.notes}
                onChangeText={(value) => setTaxFormValues((prev) => ({ ...prev, notes: value }))}
                placeholder="Optional notes"
              />
            </FormField>
          </InventorySectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <WarehouseFormSheet
        visible={warehouseFormVisible}
        mode={warehouseFormMode}
        values={warehouseFormValues}
        fieldOptions={fieldOptions}
        formScrollViewRef={warehouseFormScrollRef}
        formValidation={warehouseFormValidation}
        loading={isMutating}
        disabled={isMutating}
        onDismiss={closeWarehouseSheet}
        onSubmit={() => void submitWarehouseForm()}
        onChange={setWarehouseFormValues}
        onQuickCreateField={handleQuickCreateFieldOption}
      />

      <InventoryCategoryDetailSheet
        category={selectedCategory}
        parentLabel={
          selectedCategory?.parentId ? categoryLabelById.get(selectedCategory.parentId) : undefined
        }
        quickActions={categoryQuickActions}
        onDismiss={closeCategoryDetails}
      />

      <InventoryTaxDetailSheet
        tax={selectedTax}
        quickActions={taxQuickActions}
        onDismiss={closeTaxDetails}
      />

      <InventoryWarehouseDetailSheet
        warehouse={selectedWarehouse}
        fieldLabel={
          selectedWarehouse?.fieldId ? fieldLabelById.get(selectedWarehouse.fieldId) : undefined
        }
        quickActions={warehouseQuickActions}
        onDismiss={closeWarehouseDetails}
      />

      <InventoryProductDetailSheet
        product={selectedProduct}
        categoryLabel={
          selectedProduct?.categoryId ? categoryLabelById.get(selectedProduct.categoryId) : undefined
        }
        supplierLabel={
          selectedProduct?.supplierId ? supplierLabelById.get(selectedProduct.supplierId) : undefined
        }
        manufacturerLabel={
          selectedProduct?.manufacturerId
            ? manufacturerLabelById.get(selectedProduct.manufacturerId)
            : selectedProduct?.manufacturer || undefined
        }
        taxLabel={selectedProduct?.taxId ? taxLabelById.get(selectedProduct.taxId) : undefined}
        quickActions={productQuickActions}
        onDismiss={closeProductDetails}
      />

      <BottomSheet
        visible={productFormVisible}
        onDismiss={handleProductSheetDismiss}
        scrollViewRef={productFormScrollRef}
        title={productFormMode === 'create' ? 'Create Product' : 'Edit Product'}
        testID="inventory-product-form"
        footer={
          <View style={styles.productWizardFooter}>
            <AppButton
              label="Cancel"
              mode="text"
              tone="neutral"
              onPress={handleProductSheetDismiss}
              disabled={isMutating}
            />
            <View style={styles.productWizardFooterActions}>
              {visibleProductSteps.indexOf(productWizardStep) > 0 ? (
                <AppButton
                  label="Back"
                  mode="outlined"
                  tone="neutral"
                  onPress={goToPreviousProductStep}
                  disabled={isMutating}
                />
              ) : null}
              {visibleProductSteps[visibleProductSteps.length - 1] === productWizardStep ? (
                <AppButton
                  label={productFormMode === 'create' ? 'Create' : 'Save'}
                  onPress={() => void submitProductForm()}
                  loading={isMutating}
                  disabled={isMutating}
                />
              ) : (
                <AppButton
                  label="Next"
                  onPress={goToNextProductStep}
                  disabled={isMutating}
                />
              )}
            </View>
          </View>
        }
      >
        <FormValidationProvider value={productFormValidation.providerValue}>
          <UnderlineTabs
            value={productWizardStep}
            onValueChange={(value) => setProductWizardStep(value as ProductWizardStep)}
            tabs={productStepOptions}
            testID="inventory-product-form.steps"
          />

          {productWizardStep === 'a' ? (
            <InventorySectionCard
              title="Basic Product Information"
              description="Core identity, sourcing, and merchandising fields for the product catalog."
            >
              <FormField label="Name" name="name" required errorText={productFormErrors.name}>
                <AppInput
                  value={productFormValues.name}
                  onChangeText={(value) => {
                    setProductFormValues((prev) => ({ ...prev, name: value }));
                    clearProductValidationError('name');
                  }}
                  placeholder="Product name"
                />
              </FormField>
            <FormField label="SKU">
              <AppInput
                value={productFormValues.sku}
                onChangeText={(value) => setProductFormValues((prev) => ({ ...prev, sku: value }))}
                placeholder="Optional SKU"
              />
            </FormField>
            <FormField label="Description">
              <AppTextArea
                value={productFormValues.description}
                onChangeText={(value) =>
                  setProductFormValues((prev) => ({ ...prev, description: value }))
                }
                placeholder="Optional description"
              />
            </FormField>
            <FormField
              label="Product type"
              name="productType"
              required
              errorText={productFormErrors.productType}
            >
              <AppSelect
                value={productFormValues.productType || '__none__'}
                onChange={(value) => {
                  handleProductTypeChange(value === '__none__' ? '' : value);
                  clearProductValidationError('productType');
                }}
                options={[{ label: 'Select product type', value: '__none__' }, ...PRODUCT_TYPE_OPTIONS]}
              />
            </FormField>
            {productFormValues.productType === 'other' ? (
              <FormField label="Other product type">
                <AppInput
                  value={productFormValues.otherProductType}
                  onChangeText={(value) =>
                    setProductFormValues((prev) => ({ ...prev, otherProductType: value }))
                  }
                  placeholder="Specify custom product type"
                />
              </FormField>
            ) : null}
            <FormField
              label="Usage type"
              name="usageType"
              required
              errorText={productFormErrors.usageType}
            >
              <AppSelect
                value={productFormValues.usageType}
                onChange={(value) => {
                  updateProductUsageType(value);
                  clearProductValidationError('usageType');
                }}
                options={PRODUCT_USAGE_TYPE_OPTIONS.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
              />
            </FormField>
            <FormField label="Category">
              <AppSelect
                value={productFormValues.categoryId || '__none__'}
                onChange={(value) =>
                  setProductFormValues((prev) => ({
                    ...prev,
                    categoryId: value === '__none__' ? '' : value,
                  }))
                }
                options={[{ label: 'No category', value: '__none__' }, ...categoryOptions]}
                searchable
                onCreateOption={openProductCategoryQuickAdd}
                createOptionLabel="Create category"
              />
            </FormField>
            <FormField label="Supplier">
              <AppSelect
                value={productFormValues.supplierId || '__none__'}
                onChange={(value) =>
                  setProductFormValues((prev) => ({
                    ...prev,
                    supplierId: value === '__none__' ? '' : value,
                  }))
                }
                options={[{ label: 'No supplier', value: '__none__' }, ...supplierSelectOptions]}
                searchable
                onCreateOption={() => openProductContactQuickAdd('supplier')}
                createOptionLabel="Create supplier"
              />
            </FormField>
            <FormField label="Tax">
              <AppSelect
                value={productFormValues.taxId || '__none__'}
                onChange={(value) =>
                  setProductFormValues((prev) => ({
                    ...prev,
                    taxId: value === '__none__' ? '' : value,
                  }))
                }
                options={[{ label: 'No tax', value: '__none__' }, ...taxOptions]}
                searchable
                onCreateOption={openProductTaxQuickAdd}
                createOptionLabel="Create tax"
              />
            </FormField>
            <FormField label="Manufacturer">
              <AppSelect
                value={productFormValues.manufacturerId || '__none__'}
                onChange={(value) => {
                  const manufacturerId = value === '__none__' ? '' : value;
                  const manufacturerName =
                    manufacturerSelectOptions.find((option) => option.value === manufacturerId)?.label ?? '';
                  setProductFormValues((prev) => ({
                    ...prev,
                    manufacturerId,
                    manufacturer: manufacturerName,
                  }));
                }}
                options={[
                  { label: 'No manufacturer', value: '__none__' },
                  ...manufacturerSelectOptions,
                ]}
                searchable
                onCreateOption={() => openProductContactQuickAdd('manufacturer')}
                createOptionLabel="Create manufacturer"
              />
            </FormField>
            <FormField label="Manufacturer name">
              <AppInput
                value={productFormValues.manufacturer}
                onChangeText={(value) => setProductFormValues((prev) => ({ ...prev, manufacturer: value }))}
                placeholder="Manufacturer display name"
              />
            </FormField>
            <FormField label="Origin country">
              <AppInput
                value={productFormValues.originCountry}
                onChangeText={(value) => setProductFormValues((prev) => ({ ...prev, originCountry: value }))}
                placeholder="Optional country"
              />
            </FormField>
            <FormField label="Barcode">
              <AppInput
                value={productFormValues.barcode}
                onChangeText={(value) => setProductFormValues((prev) => ({ ...prev, barcode: value }))}
                placeholder="Optional barcode"
              />
            </FormField>
            <FormField label="Existing image URLs">
              {productFormValues.imagesExisting.length === 0 ? (
                <Text style={styles.inlineHint}>No existing images</Text>
              ) : (
                <View style={styles.tagsWrap}>
                  {productFormValues.imagesExisting.map((url, index) => (
                    <AppButton
                      key={`existing-image-${url}-${index}`}
                      label={`Remove ${index + 1}`}
                      mode="outlined"
                      tone="neutral"
                      onPress={() =>
                        setProductFormValues((prev) => ({
                          ...prev,
                          imagesExisting: prev.imagesExisting.filter((_, imageIndex) => imageIndex !== index),
                        }))
                      }
                    />
                  ))}
                </View>
              )}
            </FormField>
            <FormField label="Add image URL">
              <AppInput
                value={imageUrlDraft}
                onChangeText={setImageUrlDraft}
                placeholder="https://..."
              />
              <AppButton
                label="Add image URL"
                mode="outlined"
                tone="neutral"
                onPress={addImageUrl}
                disabled={!imageUrlDraft.trim()}
              />
              {productFormValues.imagesNew.length > 0 ? (
                <View style={styles.tagsWrap}>
                  {productFormValues.imagesNew.map((url, index) => (
                    <AppButton
                      key={`new-image-${url}-${index}`}
                      label={`Remove new ${index + 1}`}
                      mode="outlined"
                      tone="neutral"
                      onPress={() =>
                        setProductFormValues((prev) => ({
                          ...prev,
                          imagesNew: prev.imagesNew.filter((_, imageIndex) => imageIndex !== index),
                        }))
                      }
                    />
                  ))}
                </View>
              ) : null}
            </FormField>
            </InventorySectionCard>
          ) : null}

          {productWizardStep === 'b' &&
          isPesticideFamilyProductType(productFormValues.productType) ? (
            <>
              <InventorySectionCard
                title="Regulatory & Agronomy"
                description="Fields that control pesticide-family compliance, guidance, and reference data."
              >
                <FormField label="Product form code">
                  <AppSelect
                    value={productFormValues.productFormCode || '__none__'}
                    onChange={(value) =>
                      setProductFormValues((prev) => ({
                        ...prev,
                        productFormCode: value === '__none__' ? '' : value,
                      }))
                    }
                    options={[{ label: 'Select form code', value: '__none__' }, ...PRODUCT_FORM_OPTIONS]}
                  />
                </FormField>
                <FormField label="Add active ingredient">
                  <AppSelect
                    value={activeIngredientDraft || '__none__'}
                    onChange={(value) => setActiveIngredientDraft(value === '__none__' ? '' : value)}
                    options={[
                      { label: 'Select ingredient', value: '__none__' },
                      ...activeIngredientSelectOptions,
                    ]}
                  />
                  <AppButton
                    label="Add ingredient"
                    mode="outlined"
                    tone="neutral"
                    onPress={() => {
                      if (!activeIngredientDraft.trim()) return;
                      setProductFormValues((prev) => ({
                        ...prev,
                        activeIngredients: [...prev.activeIngredients, activeIngredientDraft.trim()],
                      }));
                      setActiveIngredientDraft('');
                    }}
                    disabled={!activeIngredientDraft.trim()}
                  />
                  {productFormValues.activeIngredients.length > 0 ? (
                    <View style={styles.chipsWrap}>
                      {productFormValues.activeIngredients.map((ingredient, index) => (
                        <AppChip
                          key={`${ingredient}-${index}`}
                          label={ingredient}
                          onPress={() =>
                            setProductFormValues((prev) => ({
                              ...prev,
                              activeIngredients: prev.activeIngredients.filter(
                                (_, ingredientIndex) => ingredientIndex !== index,
                              ),
                            }))
                          }
                        />
                      ))}
                    </View>
                  ) : null}
                </FormField>
                <FormField label="Dose text">
                  <AppInput
                    value={productFormValues.doseText}
                    onChangeText={(value) =>
                      setProductFormValues((prev) => ({ ...prev, doseText: value }))
                    }
                    placeholder="e.g. 5"
                  />
                </FormField>
                <FormField
                  label="Dose unit"
                  name="doseUnitOtherText"
                  errorText={productFormErrors.doseUnitOtherText}
                >
                  <AppSelect
                    value={productFormValues.doseUnit || '__none__'}
                    onChange={(value) => {
                      clearProductValidationError('doseUnitOtherText');
                      setProductFormValues((prev) => ({
                        ...prev,
                        doseUnit: value === '__none__' ? '' : value,
                      }));
                    }}
                    options={[{ label: 'Select dose unit', value: '__none__' }, ...PRODUCT_DOSE_UNIT_OPTIONS]}
                  />
                </FormField>
                {productFormValues.doseUnit === 'other' ? (
                  <FormField
                    label="Dose unit custom text"
                    name="doseUnitOtherText"
                    errorText={productFormErrors.doseUnitOtherText}
                  >
                    <AppInput
                      value={productFormValues.doseUnitOtherText}
                      onChangeText={(value) => {
                        clearProductValidationError('doseUnitOtherText');
                        setProductFormValues((prev) => ({ ...prev, doseUnitOtherText: value }));
                      }}
                      placeholder="Enter custom dose unit"
                    />
                  </FormField>
                ) : null}
                <FormField label="Active ingredient concentration percent">
                  <AppInput
                    value={productFormValues.activeIngredientConcentrationPercent}
                    onChangeText={(value) =>
                      setProductFormValues((prev) => ({
                        ...prev,
                        activeIngredientConcentrationPercent: value,
                      }))
                    }
                    placeholder="e.g. 18"
                  />
                </FormField>
                <FormField label="PHI min days">
                  <AppInput
                    value={productFormValues.phiMinDays}
                    onChangeText={(value) =>
                      setProductFormValues((prev) => ({ ...prev, phiMinDays: value }))
                    }
                    placeholder="e.g. 3"
                    keyboardType="numeric"
                  />
                </FormField>
                <FormField
                  label="PHI max days"
                  name="phiMaxDays"
                  errorText={productFormErrors.phiMaxDays}
                >
                  <AppInput
                    value={productFormValues.phiMaxDays}
                    onChangeText={(value) => {
                      setProductFormValues((prev) => ({ ...prev, phiMaxDays: value }));
                      clearProductValidationError('phiMaxDays');
                    }}
                    placeholder="e.g. 7"
                    keyboardType="numeric"
                  />
                </FormField>
                <FormField
                  label="Target organisms (auto-generated)"
                  helperText="Derived from selected active ingredients."
                >
                  <AppTextArea
                    value={productFormValues.targetOrganismsText}
                    onChangeText={() => undefined}
                    placeholder="Auto-generated organisms list"
                    disabled
                  />
                </FormField>
                <FormField label="Reference URLs">
                  <AppInput
                    value={referenceUrlDraft}
                    onChangeText={setReferenceUrlDraft}
                    placeholder="https://..."
                  />
                  <AppButton
                    label="Add reference URL"
                    mode="outlined"
                    tone="neutral"
                    onPress={addReferenceUrlToProduct}
                    disabled={!referenceUrlDraft.trim()}
                  />
                  {productFormValues.referenceUrls.length > 0 ? (
                    <View style={styles.tagsWrap}>
                      {productFormValues.referenceUrls.map((url, index) => (
                        <AppButton
                          key={`${url}-${index}`}
                          label={`Remove URL ${index + 1}`}
                          mode="outlined"
                          tone="neutral"
                          onPress={() =>
                            setProductFormValues((prev) => ({
                              ...prev,
                              referenceUrls: prev.referenceUrls.filter((_, urlIndex) => urlIndex !== index),
                            }))
                          }
                        />
                      ))}
                    </View>
                  ) : null}
                </FormField>
              </InventorySectionCard>

              <InventorySectionCard
                title="Crop Guidance Rows"
                description="Optional agronomy rows. Entries without a crop stay out of the submit payload."
              >
                <View style={styles.productArrayHeader}>
              <Text style={styles.productArrayTitle}>Crop guidance rows</Text>
              <AppButton
                label="Add row"
                mode="outlined"
                tone="neutral"
                onPress={() =>
                  setProductFormValues((prev) => ({
                    ...prev,
                    cropGuidanceRows: [...prev.cropGuidanceRows, createEmptyCropGuidanceRow()],
                  }))
                }
              />
                </View>
                {productFormValues.cropGuidanceRows.length === 0 ? (
                  <Text style={styles.inlineHint}>No crop guidance rows yet.</Text>
                ) : (
                  <View style={styles.arrayRows}>
                {productFormValues.cropGuidanceRows.map((row, index) => (
                  <InventorySectionCard
                    key={`crop-guidance-${index}`}
                    title={`Crop guidance ${index + 1}`}
                    description="Rows without crop ID are dropped at submit."
                  >
                      <FormField label="Crop">
                        {cropSelectOptions.length > 0 ? (
                          <AppSelect
                            value={row.cropId || '__none__'}
                            onChange={(value) =>
                              updateCropRow(index, { cropId: value === '__none__' ? '' : value })
                            }
                            options={[{ label: 'Select crop', value: '__none__' }, ...cropSelectOptions]}
                          />
                        ) : (
                          <AppInput
                            value={row.cropId}
                            onChangeText={(value) => updateCropRow(index, { cropId: value })}
                            placeholder="Crop ID"
                          />
                        )}
                      </FormField>
                      <FormField label="Region scope">
                        <AppInput
                          value={row.regionScope}
                          onChangeText={(value) => updateCropRow(index, { regionScope: value })}
                          placeholder="Optional region scope"
                        />
                      </FormField>
                      <FormField label="Target organisms text">
                        <AppTextArea
                          value={row.targetOrganismsText}
                          onChangeText={(value) => updateCropRow(index, { targetOrganismsText: value })}
                          placeholder="Optional row-level targets"
                        />
                      </FormField>
                      <FormField label="Dose text">
                        <AppInput
                          value={row.doseText}
                          onChangeText={(value) => updateCropRow(index, { doseText: value })}
                          placeholder="Optional row dose text"
                        />
                      </FormField>
                      <FormField label="Dose unit">
                        <AppInput
                          value={row.doseUnit}
                          onChangeText={(value) => updateCropRow(index, { doseUnit: value })}
                          placeholder="Optional row dose unit"
                        />
                      </FormField>
                      <FormField label="PHI days">
                        <AppInput
                          value={row.phiDays}
                          onChangeText={(value) => updateCropRow(index, { phiDays: value })}
                          placeholder="Optional PHI days"
                          keyboardType="numeric"
                        />
                      </FormField>
                      <FormField label="REI hours">
                        <AppInput
                          value={row.reiHours}
                          onChangeText={(value) => updateCropRow(index, { reiHours: value })}
                          placeholder="Optional REI hours"
                          keyboardType="numeric"
                        />
                      </FormField>
                      <FormField label="Notes">
                        <AppTextArea
                          value={row.notes}
                          onChangeText={(value) => updateCropRow(index, { notes: value })}
                          placeholder="Optional notes"
                        />
                      </FormField>
                      <FormField label="Reference URLs">
                        <AppInput
                          value={cropReferenceDrafts[index] ?? ''}
                          onChangeText={(value) =>
                            setCropReferenceDrafts((prev) => ({ ...prev, [index]: value }))
                          }
                          placeholder="https://..."
                        />
                        <AppButton
                          label="Add row URL"
                          mode="outlined"
                          tone="neutral"
                          onPress={() => addCropReferenceUrl(index)}
                          disabled={!(cropReferenceDrafts[index] ?? '').trim()}
                        />
                        {row.referenceUrls.length > 0 ? (
                          <View style={styles.tagsWrap}>
                            {row.referenceUrls.map((url, urlIndex) => (
                              <AppButton
                                key={`${url}-${urlIndex}`}
                                label={`Remove row URL ${urlIndex + 1}`}
                                mode="outlined"
                                tone="neutral"
                                onPress={() =>
                                  updateCropRow(index, {
                                    referenceUrls: row.referenceUrls.filter(
                                      (_, referenceIndex) => referenceIndex !== urlIndex,
                                    ),
                                  })
                                }
                              />
                            ))}
                          </View>
                        ) : null}
                      </FormField>
                      <AppButton
                        label="Remove crop row"
                        mode="outlined"
                        tone="destructive"
                        onPress={() =>
                          setProductFormValues((prev) => ({
                            ...prev,
                            cropGuidanceRows: prev.cropGuidanceRows.filter(
                              (_, rowIndex) => rowIndex !== index,
                            ),
                          }))
                        }
                      />
                  </InventorySectionCard>
                ))}
                  </View>
                )}
              </InventorySectionCard>
            </>
          ) : null}

          {productWizardStep === 'c' ? (
            <>
              <InventorySectionCard
                title="Pricing & Visibility"
                description="Selling configuration, availability, and storefront behavior."
              >
                <FormField label="Sale price">
                  <AppInput
                    value={productFormValues.salePrice}
                    onChangeText={(value) =>
                      setProductFormValues((prev) => ({ ...prev, salePrice: value }))
                    }
                    placeholder="Optional sale price"
                    keyboardType="numeric"
                  />
                </FormField>
                <FormField label="Wholesale price">
                  <AppInput
                    value={productFormValues.wholesalePrice}
                    onChangeText={(value) =>
                      setProductFormValues((prev) => ({ ...prev, wholesalePrice: value }))
                    }
                    placeholder="Optional wholesale price"
                    keyboardType="numeric"
                  />
                </FormField>
                <FormField label="Threshold">
                  <AppInput
                    value={productFormValues.threshold}
                    onChangeText={(value) =>
                      setProductFormValues((prev) => ({ ...prev, threshold: value }))
                    }
                    placeholder="Optional threshold"
                    keyboardType="numeric"
                  />
                </FormField>
                <FormField label="Status">
                  <AppSelect
                    value={productFormValues.status}
                    onChange={(value) =>
                      setProductFormValues((prev) => ({ ...prev, status: normalizeStatus(value) }))
                    }
                    options={ROW_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
                  />
                </FormField>
                <FormField label="Storefront visibility">
                  <AppSelect
                    value={toYesNo(productFormValues.displayOnStorefront)}
                    onChange={(value) =>
                      setProductFormValues((prev) => ({
                        ...prev,
                        displayOnStorefront: value === 'yes',
                      }))
                    }
                    options={[
                      { label: 'Visible', value: 'yes' },
                      { label: 'Hidden', value: 'no' },
                    ]}
                    disabled={productFormValues.usageType === 'FarmInput'}
                  />
                </FormField>
                {productFormValues.usageType === 'FarmInput' ? (
                  <Text style={styles.inlineHint}>
                    Storefront visibility is forced to hidden for Farm Input usage type.
                  </Text>
                ) : null}
              </InventorySectionCard>

              <InventorySectionCard
                title="Inventory Records"
                description="Warehouse-level stock records submitted with the product."
              >
                <View style={styles.productArrayHeader}>
                  <Text style={styles.productArrayTitle}>Inventory records</Text>
                  <AppButton
                    label="Add inventory record"
                    mode="outlined"
                    tone="neutral"
                    onPress={() =>
                      setProductFormValues((prev) => ({
                        ...prev,
                        inventoryRecords: [...prev.inventoryRecords, createEmptyInventoryRecord()],
                      }))
                    }
                  />
                </View>
                {productFormValues.inventoryRecords.length === 0 ? (
                  <Text style={styles.inlineHint}>No inventory records yet.</Text>
                ) : (
                  <View style={styles.arrayRows}>
                {productFormValues.inventoryRecords.map((record, index) => (
                  <InventorySectionCard
                    key={`inventory-record-${index}`}
                    title={`Inventory record ${index + 1}`}
                  >
                      <FormField label="Batch number">
                        <AppInput
                          value={record.batchNumber}
                          onChangeText={(value) =>
                            setProductFormValues((prev) => ({
                              ...prev,
                              inventoryRecords: prev.inventoryRecords.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, batchNumber: value } : row,
                              ),
                            }))
                          }
                          placeholder="Optional batch number"
                        />
                      </FormField>
                      <FormField label="Warehouse">
                        <AppSelect
                          value={record.warehouseId || '__none__'}
                          onChange={(value) =>
                            setProductFormValues((prev) => ({
                              ...prev,
                              inventoryRecords: prev.inventoryRecords.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, warehouseId: value === '__none__' ? '' : value }
                                  : row,
                              ),
                            }))
                          }
                          options={[
                            { label: 'Select warehouse', value: '__none__' },
                            ...warehouses.map((warehouse) => ({
                              label: warehouse.name,
                              value: warehouse.id,
                            })),
                          ]}
                          searchable
                          onCreateOption={() => openProductWarehouseQuickAdd(index)}
                          createOptionLabel="Create warehouse"
                        />
                      </FormField>
                      <FormField label="Quantity">
                        <AppInput
                          value={record.quantity}
                          onChangeText={(value) =>
                            setProductFormValues((prev) => ({
                              ...prev,
                              inventoryRecords: prev.inventoryRecords.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, quantity: value } : row,
                              ),
                            }))
                          }
                          placeholder="0"
                          keyboardType="numeric"
                        />
                      </FormField>
                      <FormField label="Manufacturing date">
                        <AppDatePicker
                          value={record.manufacturingDate || null}
                          onChange={(value) =>
                            setProductFormValues((prev) => ({
                              ...prev,
                              inventoryRecords: prev.inventoryRecords.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, manufacturingDate: value ?? '' }
                                  : row,
                              ),
                            }))
                          }
                          placeholder="No manufacturing date"
                        />
                      </FormField>
                      <FormField label="Expiry date">
                        <AppDatePicker
                          value={record.expiryDate || null}
                          onChange={(value) =>
                            setProductFormValues((prev) => ({
                              ...prev,
                              inventoryRecords: prev.inventoryRecords.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, expiryDate: value ?? '' }
                                  : row,
                              ),
                            }))
                          }
                          placeholder="No expiry date"
                        />
                      </FormField>
                      <FormField label="Expiry days">
                        <AppInput
                          value={record.expiryDays}
                          onChangeText={(value) =>
                            setProductFormValues((prev) => ({
                              ...prev,
                              inventoryRecords: prev.inventoryRecords.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, expiryDays: value } : row,
                              ),
                            }))
                          }
                          placeholder="Optional expiry days"
                          keyboardType="numeric"
                        />
                      </FormField>
                      <FormField label="Notes">
                        <AppTextArea
                          value={record.notes}
                          onChangeText={(value) =>
                            setProductFormValues((prev) => ({
                              ...prev,
                              inventoryRecords: prev.inventoryRecords.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, notes: value } : row,
                              ),
                            }))
                          }
                          placeholder="Optional notes"
                        />
                      </FormField>
                      <AppButton
                        label="Remove inventory record"
                        mode="outlined"
                        tone="destructive"
                        onPress={() =>
                          setProductFormValues((prev) => ({
                            ...prev,
                            inventoryRecords: prev.inventoryRecords.filter(
                              (_, rowIndex) => rowIndex !== index,
                            ),
                          }))
                        }
                      />
                  </InventorySectionCard>
                ))}
                  </View>
                )}
              </InventorySectionCard>
            </>
          ) : null}
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={productCategoryQuickAddVisible}
        onDismiss={closeProductCategoryQuickAdd}
        scrollViewRef={productCategoryQuickAddScrollRef}
        title="Quick Add Category"
        footer={
          <SheetFooter
            onCancel={closeProductCategoryQuickAdd}
            onSubmit={() => void submitProductCategoryQuickAdd()}
            submitLabel="Create and Select"
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormValidationProvider value={productCategoryQuickAddValidation.providerValue}>
          <InventorySectionCard
            title="Category Quick Add"
            description="Create a category and immediately bind it to the product."
          >
            <FormField label="Name" name="name" required>
              <AppInput
                value={productCategoryQuickAddValues.name}
                onChangeText={(value) => {
                  productCategoryQuickAddValidation.clearFieldError('name');
                  setProductCategoryQuickAddValues((prev) => ({ ...prev, name: value }));
                }}
                placeholder="Category name"
              />
            </FormField>
            <FormField label="Parent category">
              <AppSelect
                value={productCategoryQuickAddValues.parentId || '__none__'}
                onChange={(value) =>
                  setProductCategoryQuickAddValues((prev) => ({
                    ...prev,
                    parentId: value === '__none__' ? '' : value,
                  }))
                }
                options={[{ label: 'Top-level', value: '__none__' }, ...categoryOptions]}
                searchable
              />
            </FormField>
            <FormField label="Storefront visibility">
              <AppSelect
                value={toYesNo(productCategoryQuickAddValues.displayOnStorefront)}
                onChange={(value) =>
                  setProductCategoryQuickAddValues((prev) => ({
                    ...prev,
                    displayOnStorefront: value === 'yes',
                  }))
                }
                options={[
                  { label: 'Visible', value: 'yes' },
                  { label: 'Hidden', value: 'no' },
                ]}
              />
            </FormField>
            <FormField label="Image URL">
              <AppInput
                value={productCategoryQuickAddValues.imageUrl}
                onChangeText={(value) =>
                  setProductCategoryQuickAddValues((prev) => ({ ...prev, imageUrl: value }))
                }
                placeholder="Optional image URL"
              />
            </FormField>
            <FormField label="Notes">
              <AppTextArea
                value={productCategoryQuickAddValues.notes}
                onChangeText={(value) =>
                  setProductCategoryQuickAddValues((prev) => ({ ...prev, notes: value }))
                }
                placeholder="Optional notes"
              />
            </FormField>
          </InventorySectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={productTaxQuickAddVisible}
        onDismiss={closeProductTaxQuickAdd}
        scrollViewRef={productTaxQuickAddScrollRef}
        title="Quick Add Tax"
        footer={
          <SheetFooter
            onCancel={closeProductTaxQuickAdd}
            onSubmit={() => void submitProductTaxQuickAdd()}
            submitLabel="Create and Select"
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormValidationProvider value={productTaxQuickAddValidation.providerValue}>
          <InventorySectionCard
            title="Tax Quick Add"
            description="Create a tax row and immediately assign it to the product."
          >
            <FormField label="Name" name="name" required>
              <AppInput
                value={productTaxQuickAddValues.name}
                onChangeText={(value) => {
                  productTaxQuickAddValidation.clearFieldError('name');
                  setProductTaxQuickAddValues((prev) => ({ ...prev, name: value }));
                }}
                placeholder="Tax name"
              />
            </FormField>
            <FormField label="Rate %" name="rate" required>
              <AppInput
                value={productTaxQuickAddValues.rate}
                onChangeText={(value) => {
                  productTaxQuickAddValidation.clearFieldError('rate');
                  setProductTaxQuickAddValues((prev) => ({ ...prev, rate: value }));
                }}
                placeholder="16"
                keyboardType="numeric"
              />
            </FormField>
            <FormField label="Notes">
              <AppTextArea
                value={productTaxQuickAddValues.notes}
                onChangeText={(value) => setProductTaxQuickAddValues((prev) => ({ ...prev, notes: value }))}
                placeholder="Optional notes"
              />
            </FormField>
          </InventorySectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={productContactQuickAddVisible}
        onDismiss={closeProductContactQuickAdd}
        scrollViewRef={productContactQuickAddScrollRef}
        title={productContactQuickAddKind === 'supplier' ? 'Quick Add Supplier' : 'Quick Add Manufacturer'}
        footer={
          <SheetFooter
            onCancel={closeProductContactQuickAdd}
            onSubmit={() => void submitProductContactQuickAdd()}
            submitLabel="Create and Select"
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormValidationProvider value={productContactQuickAddValidation.providerValue}>
          <InventorySectionCard
            title={
              productContactQuickAddKind === 'supplier'
                ? 'Supplier Quick Add'
                : 'Manufacturer Quick Add'
            }
            description="Create a contact and bind it directly to the product draft."
          >
            <FormField label="Name" name="name" required>
              <AppInput
                value={productContactQuickAddValues.name}
                onChangeText={(value) => {
                  productContactQuickAddValidation.clearFieldError('name');
                  setProductContactQuickAddValues((prev) => ({ ...prev, name: value }));
                }}
                placeholder="Contact name"
              />
            </FormField>
            <FormField label="Company">
              <AppInput
                value={productContactQuickAddValues.company}
                onChangeText={(value) =>
                  setProductContactQuickAddValues((prev) => ({ ...prev, company: value }))
                }
                placeholder="Optional company"
              />
            </FormField>
            <FormField label="Phone">
              <AppInput
                value={productContactQuickAddValues.phone}
                onChangeText={(value) =>
                  setProductContactQuickAddValues((prev) => ({ ...prev, phone: value }))
                }
                placeholder="Optional phone"
                keyboardType="phone-pad"
              />
            </FormField>
            <FormField label="Email">
              <AppInput
                value={productContactQuickAddValues.email}
                onChangeText={(value) =>
                  setProductContactQuickAddValues((prev) => ({ ...prev, email: value }))
                }
                placeholder="Optional email"
                autoCapitalize="none"
              />
            </FormField>
            <FormField label="Address">
              <AppInput
                value={productContactQuickAddValues.address}
                onChangeText={(value) =>
                  setProductContactQuickAddValues((prev) => ({ ...prev, address: value }))
                }
                placeholder="Optional address"
              />
            </FormField>
            <View style={styles.quickAddTwoColumn}>
              <View style={styles.quickAddColumn}>
                <FormField label="Country">
                  <AppInput
                    value={productContactQuickAddValues.country}
                    onChangeText={(value) =>
                      setProductContactQuickAddValues((prev) => ({ ...prev, country: value }))
                    }
                    placeholder="Optional country"
                  />
                </FormField>
              </View>
              <View style={styles.quickAddColumn}>
                <FormField label="City/Region">
                  <AppInput
                    value={productContactQuickAddValues.cityRegion}
                    onChangeText={(value) =>
                      setProductContactQuickAddValues((prev) => ({ ...prev, cityRegion: value }))
                    }
                    placeholder="Optional city/region"
                  />
                </FormField>
              </View>
            </View>
            <FormField label="Tax ID">
              <AppInput
                value={productContactQuickAddValues.taxId}
                onChangeText={(value) =>
                  setProductContactQuickAddValues((prev) => ({ ...prev, taxId: value }))
                }
                placeholder="Optional tax ID"
              />
            </FormField>
            <FormField label="Notes">
              <AppTextArea
                value={productContactQuickAddValues.notes}
                onChangeText={(value) =>
                  setProductContactQuickAddValues((prev) => ({ ...prev, notes: value }))
                }
                placeholder="Optional notes"
              />
            </FormField>
          </InventorySectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={productWarehouseQuickAddVisible}
        onDismiss={closeProductWarehouseQuickAdd}
        scrollViewRef={productWarehouseQuickAddScrollRef}
        title="Quick Add Warehouse"
        footer={
          <SheetFooter
            onCancel={closeProductWarehouseQuickAdd}
            onSubmit={() => void submitProductWarehouseQuickAdd()}
            submitLabel="Create and Select"
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormValidationProvider value={productWarehouseQuickAddValidation.providerValue}>
          <InventorySectionCard
            title="Warehouse Quick Add"
            description="Create a warehouse and attach it directly to the inventory row."
          >
            <FormField label="Name" name="name" required>
              <AppInput
                value={productWarehouseQuickAddValues.name}
                onChangeText={(value) => {
                  productWarehouseQuickAddValidation.clearFieldError('name');
                  setProductWarehouseQuickAddValues((prev) => ({ ...prev, name: value }));
                }}
                placeholder="Warehouse name"
              />
            </FormField>
            <FormField label="Field" name="fieldId" required>
              <AppSelect
                value={productWarehouseQuickAddValues.fieldId || '__none__'}
                onChange={(value) => {
                  productWarehouseQuickAddValidation.clearFieldError('fieldId');
                  setProductWarehouseQuickAddValues((prev) => ({
                    ...prev,
                    fieldId: value === '__none__' ? '' : value,
                  }));
                }}
                options={[{ label: 'Select field', value: '__none__' }, ...fieldOptions]}
                searchable
              />
            </FormField>
            <FormField label="Notes">
              <AppTextArea
                value={productWarehouseQuickAddValues.notes}
                onChangeText={(value) =>
                  setProductWarehouseQuickAddValues((prev) => ({ ...prev, notes: value }))
                }
                placeholder="Optional notes"
              />
            </FormField>
          </InventorySectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <ActionSheet
        visible={Boolean(actionTarget) && !confirmTarget && actionSheetActions.length > 0}
        onDismiss={() => setActionTarget(null)}
        title={actionTarget?.item.name}
        message="Choose an action for this record."
        actions={actionSheetActions}
      />

      <ConfirmDialog
        visible={Boolean(confirmTarget)}
        title={
          confirmTarget?.type === 'product-status' && confirmTarget.nextStatus === 'inactive'
            ? 'Deactivate Product'
            : confirmTarget?.type === 'product-status' && confirmTarget.nextStatus === 'active'
              ? 'Reactivate Product'
              : confirmTarget?.type?.endsWith('status')
              ? 'Confirm Status Change'
              : 'Confirm'
        }
        message={
          confirmTarget?.type === 'product-status' && confirmTarget.nextStatus === 'inactive'
            ? 'Deactivate this product record? This is not permanent and it can be reactivated.'
            : confirmTarget
              ? `Set ${confirmTarget.item.name} status to ${confirmTarget.nextStatus}?`
              : ''
        }
        confirmLabel={
          confirmTarget?.type === 'product-status' && confirmTarget.nextStatus === 'inactive'
            ? 'Deactivate'
            : confirmTarget?.type === 'product-status' && confirmTarget.nextStatus === 'active'
              ? 'Reactivate'
              : 'Confirm'
        }
        confirmTone={
          confirmTarget?.type === 'product-status' && confirmTarget.nextStatus === 'inactive'
            ? 'destructive'
            : 'primary'
        }
        confirmLoading={isMutating}
        confirmDisabled={isMutating}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => void submitConfirmAction()}
      />
    </>
  );
}

function MetaBadge({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant: 'success' | 'warning' | 'accent' | 'neutral';
}) {
  return (
    <View style={styles.metaGroup}>
      <Text style={styles.metaText}>{label}</Text>
      <AppBadge value={value} variant={variant} />
    </View>
  );
}

function InventoryTopActions({
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
      <AppButton
        label="Cancel"
        mode="text"
        tone="neutral"
        onPress={onCancel}
        disabled={loading}
      />
      <AppButton
        label={submitLabel}
        onPress={onSubmit}
        loading={loading}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  productHeader: {
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    gap: spacing.md,
  },
  productHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  productHeaderLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  productHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: palette.foreground,
  },
  productHeaderActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  productScrollView: {
    flex: 1,
  },
  productMain: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  productWizardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  productWizardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineHint: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  productArrayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  productArrayTitle: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  arrayRows: {
    gap: spacing.sm,
  },
  quickAddTwoColumn: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAddColumn: {
    flex: 1,
  },
});
