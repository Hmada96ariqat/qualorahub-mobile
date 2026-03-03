export type I18nNamespace =
  | 'fields'
  | 'lots'
  | 'units'
  | 'soil'
  | 'irrigation'
  | 'map'
  | 'validation'
  | 'common';

const DICTIONARY: Record<I18nNamespace, Record<string, string>> = {
  common: {
    create: 'Create',
    save: 'Save',
    cancel: 'Cancel',
    refresh: 'Refresh',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    grid: 'Grid',
    table: 'Table',
    next: 'Next',
    previous: 'Previous',
    noResults: 'No results found.',
    permissionDenied: 'You do not have permission for this action.',
  },
  fields: {
    title: 'Fields',
    subtitle: 'Manage farm fields and lifecycle status.',
    records: 'Field records',
    create: 'Create Field',
    edit: 'Edit Field',
    view: 'Field details',
    searchPlaceholder: 'Search fields',
    noRowsTitle: 'No fields found',
    noRowsMessage: 'Try a different search or create a new field.',
    deactivateConfirm: 'Deactivate field?',
    reactivateConfirm: 'Reactivate field?',
    parentStatusGuard: 'Activate the parent field before reactivating this lot.',
  },
  lots: {
    title: 'Lots',
    subtitle: 'Manage lot inventory and lifecycle status.',
    records: 'Lot records',
    create: 'Create Lot',
    edit: 'Edit Lot',
    view: 'Lot details',
    searchPlaceholder: 'Search lots',
    noRowsTitle: 'No lots found',
    noRowsMessage: 'Try a different search or create a new lot.',
    deactivateConfirm: 'Deactivate lot?',
    reactivateConfirm: 'Reactivate lot?',
  },
  units: {
    hectares: 'Hectares',
    acres: 'Acres',
    manzana: 'Manzana',
  },
  soil: {
    type: 'Soil type',
    category: 'Soil category',
    other: 'Other soil type',
    conditions: 'Soil conditions',
  },
  irrigation: {
    type: 'Irrigation type',
    other: 'Other irrigation type',
  },
  map: {
    boundary: 'Boundary map',
    complete: 'Complete boundary',
    undoPoint: 'Undo point',
    clear: 'Clear',
    snapHint: 'Tap near first point to close (15m).',
    insideFieldError: 'Lot boundary must stay inside the selected field boundary.',
    overlapError: 'Lot boundary overlaps an existing lot in this field.',
    invalidRevert: 'Invalid edit reverted to the last valid boundary.',
    fallback: 'Map unavailable. Use manual area fallback.',
    drawingOptional: 'Boundary is optional. If provided, geometry rules are enforced.',
  },
  validation: {
    fieldNameRequired: 'Field name is required.',
    fieldBoundaryRequired: 'Field boundary is required unless manual area fallback is provided.',
    lotNameRequired: 'Lot name is required.',
    lotFieldRequired: 'Field selection is required.',
    lotTypeRequired: 'Lot type is required.',
    lotRotationRequired: 'Crop rotation plan is required.',
    lotLightRequired: 'Light profile is required.',
    polygonMinPoints: 'Boundary needs at least 3 points.',
    polygonSelfIntersect: 'Boundary cannot self-intersect.',
  },
};

export function t(namespace: I18nNamespace, key: string, fallback?: string): string {
  const namespaced = DICTIONARY[namespace] ?? {};
  return namespaced[key] ?? fallback ?? `${namespace}.${key}`;
}
