import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
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
  INVENTORY_STATUS_OPTIONS,
  INVENTORY_TAB_OPTIONS,
  normalizeStatus,
  parseOptionalNumber,
  ROW_STATUS_OPTIONS,
  toCategoryFormValues,
  toProductFormValues,
  toTaxFormValues,
  toWarehouseFormValues,
  type CategoryFormValues,
  type InventoryFormMode,
  type InventoryStatusFilter,
  type InventoryTab,
  type ProductFormValues,
  type TaxFormValues,
  type WarehouseFormValues,
} from '../contracts';
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
  | { type: 'product-status'; item: InventoryProduct; nextStatus: 'active' | 'inactive' }
  | { type: 'product-delete'; item: InventoryProduct };

function isInactiveStatus(status: string): boolean {
  return status.toLowerCase() === 'inactive';
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
  const { showToast } = useToast();
  const {
    categories,
    taxes,
    warehouses,
    products,
    fieldOptions,
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
    hardDeleteProducts,
  } = useInventoryModule();

  const [activeTab, setActiveTab] = useState<InventoryTab>('products');
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>('all');
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

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

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ label: item.name, value: item.id })),
    [categories],
  );
  const taxOptions = useMemo(
    () => taxes.map((item) => ({ label: `${item.name} (${item.rate}%)`, value: item.id })),
    [taxes],
  );

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

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((item) => {
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
  }, [warehouses, normalizedSearch, statusFilter]);

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

  function openCreateSheet() {
    if (activeTab === 'categories') {
      setCategoryFormMode('create');
      setEditingCategory(null);
      setCategoryFormValues(toCategoryFormValues());
      setCategoryFormVisible(true);
      return;
    }

    if (activeTab === 'taxes') {
      setTaxFormMode('create');
      setEditingTax(null);
      setTaxFormValues(toTaxFormValues());
      setTaxFormVisible(true);
      return;
    }

    if (activeTab === 'warehouses') {
      setWarehouseFormMode('create');
      setEditingWarehouse(null);
      setWarehouseFormValues(toWarehouseFormValues());
      setWarehouseFormVisible(true);
      return;
    }

    setProductFormMode('create');
    setEditingProduct(null);
    setProductFormValues(toProductFormValues());
    setProductFormVisible(true);
  }

  function openEditSheet(target: ActionTarget) {
    if (target.type === 'category') {
      setCategoryFormMode('edit');
      setEditingCategory(target.item);
      setCategoryFormValues(toCategoryFormValues(target.item));
      setCategoryFormVisible(true);
      return;
    }

    if (target.type === 'tax') {
      setTaxFormMode('edit');
      setEditingTax(target.item);
      setTaxFormValues(toTaxFormValues(target.item));
      setTaxFormVisible(true);
      return;
    }

    if (target.type === 'warehouse') {
      setWarehouseFormMode('edit');
      setEditingWarehouse(target.item);
      setWarehouseFormValues(toWarehouseFormValues(target.item));
      setWarehouseFormVisible(true);
      return;
    }

    setProductFormMode('edit');
    setEditingProduct(target.item);
    setProductFormValues(toProductFormValues(target.item));
    setProductFormVisible(true);
  }

  function closeCategorySheet() {
    setCategoryFormVisible(false);
    setEditingCategory(null);
    setCategoryFormValues(toCategoryFormValues());
  }

  function closeTaxSheet() {
    setTaxFormVisible(false);
    setEditingTax(null);
    setTaxFormValues(toTaxFormValues());
  }

  function closeWarehouseSheet() {
    setWarehouseFormVisible(false);
    setEditingWarehouse(null);
    setWarehouseFormValues(toWarehouseFormValues());
  }

  function closeProductSheet() {
    setProductFormVisible(false);
    setEditingProduct(null);
    setProductFormValues(toProductFormValues());
  }

  async function submitCategoryForm() {
    const name = categoryFormValues.name.trim();
    if (!name) {
      showToast({ message: 'Category name is required.', variant: 'error' });
      return;
    }

    try {
      if (categoryFormMode === 'create') {
        await createCategory({
          name,
          parent_id: categoryFormValues.parentId.trim() || null,
          image_url: categoryFormValues.imageUrl.trim() || null,
          display_on_storefront: categoryFormValues.displayOnStorefront,
          notes: categoryFormValues.notes.trim() || null,
        });
        showToast({ message: 'Category created.', variant: 'success' });
      } else if (editingCategory) {
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
    const rate = parseOptionalNumber(taxFormValues.rate) ?? Number.NaN;
    if (!name || !Number.isFinite(rate)) {
      showToast({ message: 'Tax name and rate are required.', variant: 'error' });
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
    if (!name || !fieldId) {
      showToast({ message: 'Warehouse name and field are required.', variant: 'error' });
      return;
    }

    try {
      if (warehouseFormMode === 'create') {
        await createWarehouse({
          name,
          field_id: fieldId,
          status: warehouseFormValues.status,
          notes: warehouseFormValues.notes.trim() || null,
        });
        showToast({ message: 'Warehouse created.', variant: 'success' });
      } else if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, {
          name,
          field_id: fieldId,
          status: warehouseFormValues.status,
          notes: warehouseFormValues.notes.trim() || null,
        });
        showToast({ message: 'Warehouse updated.', variant: 'success' });
      }
      closeWarehouseSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Warehouse mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitProductForm() {
    const name = productFormValues.name.trim();
    if (!name) {
      showToast({ message: 'Product name is required.', variant: 'error' });
      return;
    }

    const payload = {
      name,
      description: productFormValues.description.trim() || null,
      category_id: productFormValues.categoryId || null,
      tax_id: productFormValues.taxId || null,
      unit: productFormValues.unit.trim() || null,
      sku: productFormValues.sku.trim() || null,
      status: productFormValues.status,
      has_expiry: productFormValues.hasExpiry,
      display_on_storefront: productFormValues.displayOnStorefront,
      threshold: parseOptionalNumber(productFormValues.threshold),
      price_per_unit: parseOptionalNumber(productFormValues.pricePerUnit),
      purchase_price: parseOptionalNumber(productFormValues.purchasePrice),
      wholesale_price: parseOptionalNumber(productFormValues.wholesalePrice),
    };

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

      if (confirmTarget.type === 'product-delete') {
        const deleted = await hardDeleteProducts({ ids: [confirmTarget.item.id] });
        showToast({
          message: deleted > 0 ? 'Product deleted.' : 'No products were deleted.',
          variant: deleted > 0 ? 'success' : 'error',
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
    const actions: ActionSheetAction[] = [
      {
        key: 'edit',
        label: 'Edit',
        onPress: () => {
          openEditSheet(actionTarget);
          setActionTarget(null);
        },
      },
    ];

    if (actionTarget.type === 'category') {
      const nextStatus = isInactiveStatus(actionTarget.item.status) ? 'active' : 'inactive';
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
    actions.push({
      key: 'delete',
      label: 'Hard delete product',
      destructive: true,
      onPress: () => {
        setConfirmTarget({
          type: 'product-delete',
          item: actionTarget.item,
        });
        setActionTarget(null);
      },
    });
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
          ? counts.warehouses
          : counts.products;

  const actionSheetActions = getActionSheetActions();

  return (
    <AppScreen scroll>
      <AppHeader
        title="Inventory Core"
        subtitle="Manage products, categories, taxes, and warehouses with reusable module patterns."
      />

      <AppTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as InventoryTab)}
        tabs={INVENTORY_TAB_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
      />

      <InventoryTopActions
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
        >
          <AppTabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as InventoryStatusFilter)}
            tabs={INVENTORY_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
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
                {activeTab === 'categories'
                  ? filteredCategories.map((item) => (
                      <AppCard key={item.id}>
                        <AppListItem
                          title={item.name}
                          description={item.notes ?? 'No notes'}
                          leftIcon="shape"
                          onPress={() => setActionTarget({ type: 'category', item })}
                        />
                        <View style={styles.rowMeta}>
                          <MetaBadge label="Status" value={item.status} variant={toStatusBadgeVariant(item.status)} />
                          <MetaBadge
                            label="Storefront"
                            value={item.displayOnStorefront ? 'Visible' : 'Hidden'}
                            variant={item.displayOnStorefront ? 'accent' : 'warning'}
                          />
                        </View>
                      </AppCard>
                    ))
                  : null}
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
                {activeTab === 'warehouses'
                  ? filteredWarehouses.map((item) => (
                      <AppCard key={item.id}>
                        <AppListItem
                          title={item.name}
                          description={item.fieldId ? `Field ${item.fieldId}` : 'No field assigned'}
                          leftIcon="warehouse"
                          onPress={() => setActionTarget({ type: 'warehouse', item })}
                        />
                        <View style={styles.rowMeta}>
                          <MetaBadge label="Status" value={item.status} variant={toStatusBadgeVariant(item.status)} />
                          <MetaBadge
                            label="Capacity"
                            value={
                              item.capacityValue !== null
                                ? `${item.capacityValue}${item.capacityUnit ? ` ${item.capacityUnit}` : ''}`
                                : 'n/a'
                            }
                            variant="neutral"
                          />
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

      <BottomSheet
        visible={categoryFormVisible}
        onDismiss={closeCategorySheet}
        title={categoryFormMode === 'create' ? 'Create Category' : 'Edit Category'}
        footer={
          <SheetFooter
            onCancel={closeCategorySheet}
            onSubmit={() => void submitCategoryForm()}
            submitLabel={categoryFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={!categoryFormValues.name.trim() || isMutating}
          />
        }
      >
        <FormField label="Name" required>
          <AppInput
            value={categoryFormValues.name}
            onChangeText={(value) => setCategoryFormValues((prev) => ({ ...prev, name: value }))}
            placeholder="Category name"
          />
        </FormField>
        <FormField label="Parent category ID">
          <AppInput
            value={categoryFormValues.parentId}
            onChangeText={(value) => setCategoryFormValues((prev) => ({ ...prev, parentId: value }))}
            placeholder="Optional parent ID"
          />
        </FormField>
        <FormField label="Image URL">
          <AppInput
            value={categoryFormValues.imageUrl}
            onChangeText={(value) => setCategoryFormValues((prev) => ({ ...prev, imageUrl: value }))}
            placeholder="Optional image URL"
          />
        </FormField>
        <FormField label="Storefront visibility">
          <AppSelect
            value={toYesNo(categoryFormValues.displayOnStorefront)}
            onChange={(value) =>
              setCategoryFormValues((prev) => ({ ...prev, displayOnStorefront: value === 'yes' }))
            }
            options={[
              { label: 'Visible', value: 'yes' },
              { label: 'Hidden', value: 'no' },
            ]}
          />
        </FormField>
        {categoryFormMode === 'edit' ? (
          <FormField label="Status">
            <AppSelect
              value={categoryFormValues.status}
              onChange={(value) =>
                setCategoryFormValues((prev) => ({ ...prev, status: normalizeStatus(value) }))
              }
              options={ROW_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
            />
          </FormField>
        ) : null}
        <FormField label="Notes">
          <AppTextArea
            value={categoryFormValues.notes}
            onChangeText={(value) => setCategoryFormValues((prev) => ({ ...prev, notes: value }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={taxFormVisible}
        onDismiss={closeTaxSheet}
        title={taxFormMode === 'create' ? 'Create Tax' : 'Edit Tax'}
        footer={
          <SheetFooter
            onCancel={closeTaxSheet}
            onSubmit={() => void submitTaxForm()}
            submitLabel={taxFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={!taxFormValues.name.trim() || !taxFormValues.rate.trim() || isMutating}
          />
        }
      >
        <FormField label="Name" required>
          <AppInput
            value={taxFormValues.name}
            onChangeText={(value) => setTaxFormValues((prev) => ({ ...prev, name: value }))}
            placeholder="Tax name"
          />
        </FormField>
        <FormField label="Rate %" required>
          <AppInput
            value={taxFormValues.rate}
            onChangeText={(value) => setTaxFormValues((prev) => ({ ...prev, rate: value }))}
            placeholder="16"
          />
        </FormField>
        <FormField label="Status">
          <AppSelect
            value={taxFormValues.status}
            onChange={(value) => setTaxFormValues((prev) => ({ ...prev, status: normalizeStatus(value) }))}
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
      </BottomSheet>

      <BottomSheet
        visible={warehouseFormVisible}
        onDismiss={closeWarehouseSheet}
        title={warehouseFormMode === 'create' ? 'Create Warehouse' : 'Edit Warehouse'}
        footer={
          <SheetFooter
            onCancel={closeWarehouseSheet}
            onSubmit={() => void submitWarehouseForm()}
            submitLabel={warehouseFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={!warehouseFormValues.name.trim() || !warehouseFormValues.fieldId.trim() || isMutating}
          />
        }
      >
        <FormField label="Name" required>
          <AppInput
            value={warehouseFormValues.name}
            onChangeText={(value) => setWarehouseFormValues((prev) => ({ ...prev, name: value }))}
            placeholder="Warehouse name"
          />
        </FormField>
        {fieldOptions.length > 0 ? (
          <FormField label="Field" required helperText="Required by warehouse create/update contract.">
            <AppSelect
              value={warehouseFormValues.fieldId || null}
              onChange={(value) => setWarehouseFormValues((prev) => ({ ...prev, fieldId: value }))}
              options={fieldOptions}
            />
          </FormField>
        ) : (
          <FormField label="Field ID" required helperText="No field options loaded; enter field UUID.">
            <AppInput
              value={warehouseFormValues.fieldId}
              onChangeText={(value) =>
                setWarehouseFormValues((prev) => ({ ...prev, fieldId: value }))
              }
              placeholder="Field UUID"
            />
          </FormField>
        )}
        <FormField label="Status">
          <AppSelect
            value={warehouseFormValues.status}
            onChange={(value) =>
              setWarehouseFormValues((prev) => ({ ...prev, status: normalizeStatus(value) }))
            }
            options={ROW_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>
        <FormField label="Notes">
          <AppTextArea
            value={warehouseFormValues.notes}
            onChangeText={(value) => setWarehouseFormValues((prev) => ({ ...prev, notes: value }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={productFormVisible}
        onDismiss={closeProductSheet}
        title={productFormMode === 'create' ? 'Create Product' : 'Edit Product'}
        footer={
          <SheetFooter
            onCancel={closeProductSheet}
            onSubmit={() => void submitProductForm()}
            submitLabel={productFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={!productFormValues.name.trim() || isMutating}
          />
        }
      >
        <FormField label="Name" required>
          <AppInput
            value={productFormValues.name}
            onChangeText={(value) => setProductFormValues((prev) => ({ ...prev, name: value }))}
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
        <FormField label="Unit">
          <AppInput
            value={productFormValues.unit}
            onChangeText={(value) => setProductFormValues((prev) => ({ ...prev, unit: value }))}
            placeholder="kg, ml, unit..."
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
          />
        </FormField>
        <FormField label="Status">
          <AppSelect
            value={productFormValues.status}
            onChange={(value) => setProductFormValues((prev) => ({ ...prev, status: normalizeStatus(value) }))}
            options={ROW_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>
        <FormField label="Has expiry">
          <AppSelect
            value={toYesNo(productFormValues.hasExpiry)}
            onChange={(value) => setProductFormValues((prev) => ({ ...prev, hasExpiry: value === 'yes' }))}
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
          />
        </FormField>
        <FormField label="Storefront visibility">
          <AppSelect
            value={toYesNo(productFormValues.displayOnStorefront)}
            onChange={(value) =>
              setProductFormValues((prev) => ({ ...prev, displayOnStorefront: value === 'yes' }))
            }
            options={[
              { label: 'Visible', value: 'yes' },
              { label: 'Hidden', value: 'no' },
            ]}
          />
        </FormField>
        <FormField label="Threshold">
          <AppInput
            value={productFormValues.threshold}
            onChangeText={(value) => setProductFormValues((prev) => ({ ...prev, threshold: value }))}
            placeholder="Optional threshold"
          />
        </FormField>
        <FormField label="Price per unit">
          <AppInput
            value={productFormValues.pricePerUnit}
            onChangeText={(value) =>
              setProductFormValues((prev) => ({ ...prev, pricePerUnit: value }))
            }
            placeholder="Optional sell price"
          />
        </FormField>
        <FormField label="Purchase price">
          <AppInput
            value={productFormValues.purchasePrice}
            onChangeText={(value) =>
              setProductFormValues((prev) => ({ ...prev, purchasePrice: value }))
            }
            placeholder="Optional purchase price"
          />
        </FormField>
        <FormField label="Wholesale price">
          <AppInput
            value={productFormValues.wholesalePrice}
            onChangeText={(value) =>
              setProductFormValues((prev) => ({ ...prev, wholesalePrice: value }))
            }
            placeholder="Optional wholesale price"
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
      </BottomSheet>

      <ActionSheet
        visible={Boolean(actionTarget) && !confirmTarget}
        onDismiss={() => setActionTarget(null)}
        title={actionTarget?.item.name}
        message="Choose an action for this record."
        actions={actionSheetActions}
      />

      <ConfirmDialog
        visible={Boolean(confirmTarget)}
        title={
          confirmTarget?.type === 'product-delete'
            ? 'Delete Product'
            : confirmTarget?.type?.endsWith('status')
              ? 'Confirm Status Change'
              : 'Confirm'
        }
        message={
          confirmTarget?.type === 'product-delete'
            ? 'This performs hard delete via command endpoint. Continue?'
            : confirmTarget
              ? `Set ${confirmTarget.item.name} status to ${confirmTarget.nextStatus}?`
              : ''
        }
        confirmLabel={confirmTarget?.type === 'product-delete' ? 'Delete' : 'Confirm'}
        confirmTone={confirmTarget?.type === 'product-delete' ? 'destructive' : 'primary'}
        confirmLoading={isMutating}
        confirmDisabled={isMutating}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => void submitConfirmAction()}
      />
    </AppScreen>
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
