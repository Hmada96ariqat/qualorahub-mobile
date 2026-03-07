import { PEST_PRODUCT_TYPES } from '../../inventory/pesticideData';

export interface PhiRestrictionEntry {
  treatmentId: string;
  treatmentDate: Date;
  productId: string;
  productName: string;
  phiDays: number;
  restrictedUntilDate: Date;
  isActive: boolean;
}

export interface PhiProductMeta {
  id: string;
  name: string | null;
  productType: string | null;
}

export interface PhiRestrictionSummary {
  productId: string;
  productName: string;
  phiDays: number;
  restrictedUntilDate: Date;
  isActive: boolean;
}

const normalizeProductType = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const startOfDay = (value: Date): Date => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const parseDate = (value: string): Date | null => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isFinite(parsed.getTime()) ? startOfDay(parsed) : null;
};

const addDays = (value: Date, amount: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
};

const toProductMetaMap = (
  value: PhiProductMeta[] | Map<string, PhiProductMeta> | Record<string, PhiProductMeta> | null | undefined,
): Map<string, PhiProductMeta> => {
  if (!value) {
    return new Map();
  }

  if (value instanceof Map) {
    return value;
  }

  if (Array.isArray(value)) {
    return new Map(
      value
        .filter((entry) => Boolean(entry?.id))
        .map((entry) => [entry.id, entry]),
    );
  }

  return new Map(Object.entries(value));
};

const toObjectArray = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry),
  );
};

const toFiniteNonNegativeInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed);
};

const toText = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isPesticideLikeType = (value: unknown): boolean =>
  (PEST_PRODUCT_TYPES as readonly string[]).includes(normalizeProductType(value));

export function collectPhiProductIds(
  treatments: Array<Record<string, unknown>>,
): string[] {
  const productIds = new Set<string>();

  for (const treatment of treatments) {
    if (String(treatment.status ?? '').toUpperCase() !== 'APPLIED') {
      continue;
    }

    for (const product of toObjectArray(treatment.products)) {
      const productId = toText(product.productId);
      const phiDays = toFiniteNonNegativeInteger(product.phiDays);
      if (!productId || phiDays === null) {
        continue;
      }

      productIds.add(productId);
    }
  }

  return Array.from(productIds);
}

export function computePhiRestrictionsForDate(args: {
  treatments: Array<Record<string, unknown>>;
  harvestDate: Date;
  productMeta?: PhiProductMeta[] | Map<string, PhiProductMeta> | Record<string, PhiProductMeta>;
  unknownProductLabel?: string;
  restrictToPesticideProducts?: boolean;
}): PhiRestrictionEntry[] {
  const harvestDay = startOfDay(args.harvestDate);
  const productMetaById = toProductMetaMap(args.productMeta);

  return args.treatments.flatMap((treatment) => {
    if (String(treatment.status ?? '').toUpperCase() !== 'APPLIED') {
      return [];
    }

    const treatmentId = toText(treatment.id);
    const treatmentDateText = toText(treatment.treatment_date);
    if (!treatmentId || !treatmentDateText) {
      return [];
    }

    const treatmentDate = parseDate(treatmentDateText);
    if (!treatmentDate) {
      return [];
    }

    return toObjectArray(treatment.products).flatMap((product) => {
      const productId = toText(product.productId);
      const phiDays = toFiniteNonNegativeInteger(product.phiDays);
      if (!productId || phiDays === null) {
        return [];
      }

      const meta = productMetaById.get(productId);
      if (
        args.restrictToPesticideProducts &&
        meta?.productType &&
        !isPesticideLikeType(meta.productType)
      ) {
        return [];
      }

      const restrictedUntilText = toText(product.restrictedUntilDate);
      const restrictedUntilDate =
        (restrictedUntilText ? parseDate(restrictedUntilText) : null) ??
        addDays(treatmentDate, phiDays);

      return [
        {
          treatmentId,
          treatmentDate,
          productId,
          productName: meta?.name?.trim() || args.unknownProductLabel || 'Unknown product',
          phiDays,
          restrictedUntilDate,
          isActive: harvestDay < restrictedUntilDate,
        },
      ];
    });
  });
}

export function summarizePhiRestrictionsByProduct(
  restrictions: PhiRestrictionEntry[],
): PhiRestrictionSummary[] {
  const byProduct = new Map<string, PhiRestrictionSummary>();

  for (const restriction of restrictions) {
    const existing = byProduct.get(restriction.productId);
    const next: PhiRestrictionSummary = {
      productId: restriction.productId,
      productName: restriction.productName,
      phiDays: restriction.phiDays,
      restrictedUntilDate: restriction.restrictedUntilDate,
      isActive: restriction.isActive,
    };

    if (!existing || next.restrictedUntilDate > existing.restrictedUntilDate) {
      byProduct.set(restriction.productId, next);
    }
  }

  return Array.from(byProduct.values()).sort((left, right) => {
    const activeDelta = Number(right.isActive) - Number(left.isActive);
    if (activeDelta !== 0) {
      return activeDelta;
    }

    return right.restrictedUntilDate.getTime() - left.restrictedUntilDate.getTime();
  });
}

export function getMostRestrictivePhiDate(
  restrictions: Array<{ restrictedUntilDate: Date; isActive: boolean }>,
): Date | null {
  const active = restrictions.filter((restriction) => restriction.isActive);
  if (active.length === 0) {
    return null;
  }

  return active.reduce<Date>(
    (current, restriction) =>
      restriction.restrictedUntilDate > current
        ? restriction.restrictedUntilDate
        : current,
    active[0].restrictedUntilDate,
  );
}
