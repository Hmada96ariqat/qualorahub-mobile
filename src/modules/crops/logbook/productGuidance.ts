import {
  ACTIVE_INGREDIENT_TARGET_MAP,
  PEST_PRODUCT_TYPES,
  PRODUCT_FORM_GROUPS,
} from '../../inventory/pesticideData';
import type { InventoryProduct } from '../../../api/modules/inventory';

const normalizeProductType = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export function isPesticideLikeProduct(product: InventoryProduct | Record<string, unknown> | null | undefined): boolean {
  if (!product) {
    return false;
  }

  const token = normalizeProductType(
    'productType' in product ? product.productType : product.product_type,
  );

  return (PEST_PRODUCT_TYPES as readonly string[]).includes(token);
}

export function getProductFormLabel(code: unknown): string | null {
  const normalizedCode = String(code ?? '').trim();
  if (!normalizedCode) {
    return null;
  }

  for (const group of PRODUCT_FORM_GROUPS) {
    const match = group.options.find((option) => option.value === normalizedCode);
    if (match) {
      return match.label;
    }
  }

  return normalizedCode;
}

export function extractActiveIngredients(product: Record<string, unknown>): string[] {
  const raw = product.active_ingredients;
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw
      .map((ingredient) => {
        if (typeof ingredient === 'string') {
          return ingredient;
        }

        if (!ingredient || typeof ingredient !== 'object') {
          return '';
        }

        const ingredientRecord = ingredient as Record<string, unknown>;
        return String(
          ingredientRecord.name ?? ingredientRecord.label ?? ingredientRecord.value ?? '',
        ).trim();
      })
      .filter(Boolean);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry ?? '').trim()).filter(Boolean);
      }
    } catch {
      return [trimmed];
    }

    return [trimmed];
  }

  if (typeof raw === 'object') {
    const single = String(
      (raw as Record<string, unknown>).name ??
        (raw as Record<string, unknown>).label ??
        (raw as Record<string, unknown>).value ??
        '',
    ).trim();
    return single ? [single] : [];
  }

  return [];
}

export function extractTargets(
  product: Record<string, unknown>,
  activeIngredients: string[],
): string | null {
  if (activeIngredients.length > 0) {
    const mapped = ACTIVE_INGREDIENT_TARGET_MAP[activeIngredients[0]];
    if (Array.isArray(mapped) && mapped.length > 0) {
      return mapped.join(', ');
    }
  }

  const raw = String(product.target_organisms_text ?? '').trim();
  return raw || null;
}

export function extractReferenceUrl(product: Record<string, unknown>): string | null {
  const refs = product.reference_urls;
  if (!refs) {
    return null;
  }

  if (Array.isArray(refs)) {
    const fromStrings = refs.find(
      (entry) => typeof entry === 'string' && entry.trim().length > 0,
    );
    if (typeof fromStrings === 'string') {
      return fromStrings.trim();
    }

    const fromObjects = refs.find(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        typeof (entry as Record<string, unknown>).url === 'string' &&
        String((entry as Record<string, unknown>).url).trim().length > 0,
    ) as Record<string, unknown> | undefined;
    if (fromObjects) {
      return String(fromObjects.url).trim();
    }
  }

  if (typeof refs === 'string' && refs.trim().length > 0) {
    return refs.trim();
  }

  return null;
}
