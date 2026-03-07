import type {
  CropPracticeMapping,
  CropSummary,
  ProductionCycleOperationSummary,
  ProductionCycleSummary,
} from '../../api/modules/crops';
import type { DotBadgeVariant, InfoGridCell, ListRowIconVariant } from '../../components';
import { isInactiveLifecycleStatus } from '../../utils/lifecycle';
import type { CropListMode } from './contracts';

const DOMAIN_AREA_LABELS: Record<string, string> = {
  SOIL_PREP: 'Soil & Land Preparation',
  WATER: 'Water & Irrigation',
  NUTRIENT: 'Nutrition & Fertilization',
  WEED_MGMT: 'Weed Management',
  CANOPY: 'Canopy & Crop Load',
  IPM: 'Protection / IPM',
  HARVEST: 'Harvest',
  POST_HARVEST: 'Post-harvest Handling',
  OTHER: 'Other',
};

const DOMAIN_AREA_ORDER = [
  'SOIL_PREP',
  'WATER',
  'NUTRIENT',
  'WEED_MGMT',
  'CANOPY',
  'IPM',
  'HARVEST',
  'POST_HARVEST',
  'OTHER',
] as const;

function normalizeStatus(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function titleize(value: string | null | undefined): string {
  const normalized = (value ?? '').trim();
  if (!normalized) return 'Unknown';
  return normalized.replaceAll('_', ' ');
}

function formatDate(value: string | null | undefined): string {
  const normalized = (value ?? '').trim();
  if (!normalized) return 'n/a';
  return normalized.slice(0, 10);
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'n/a';
  }

  return `$${value.toFixed(2)}`;
}

export function formatCropStatusLabel(value: string | null | undefined): string {
  return titleize(value);
}

export function toCropStatusBadgeVariant(value: string | null | undefined): DotBadgeVariant {
  const normalized = normalizeStatus(value);
  if (normalized === 'active') return 'success';
  if (normalized === 'inactive') return 'warning';
  if (normalized === 'planned') return 'neutral';
  if (normalized === 'closed' || normalized === 'completed' || normalized === 'cancelled') {
    return 'warning';
  }
  return 'neutral';
}

export function toCropRowIconVariant(value: string | null | undefined): ListRowIconVariant {
  const badgeVariant = toCropStatusBadgeVariant(value);
  if (badgeVariant === 'success') return 'green';
  if (badgeVariant === 'warning' || badgeVariant === 'destructive') return 'amber';
  return 'neutral';
}

export function matchesCropListMode(value: string | null | undefined, mode: CropListMode): boolean {
  if (mode === 'all') return true;
  const inactive = isInactiveLifecycleStatus(value);
  return mode === 'inactive' ? inactive : !inactive;
}

export function formatDomainAreaLabel(domainArea: string | null | undefined): string {
  const normalized = (domainArea ?? '').trim();
  if (!normalized) return DOMAIN_AREA_LABELS.OTHER;
  return DOMAIN_AREA_LABELS[normalized] ?? titleize(normalized);
}

export function formatOperationFamilyLabel(family: string | null | undefined): string {
  return titleize(family);
}

export function groupCropPractices(practices: CropPracticeMapping[]): Array<{
  key: string;
  label: string;
  items: CropPracticeMapping[];
}> {
  const groups = new Map<string, CropPracticeMapping[]>();

  for (const practice of practices) {
    const key = practice.domainArea || 'OTHER';
    const current = groups.get(key) ?? [];
    current.push(practice);
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .map(([key, items]) => ({
      key,
      label: formatDomainAreaLabel(key),
      items: items.slice().sort((left, right) => left.label.localeCompare(right.label)),
    }))
    .sort((left, right) => {
      const leftIndex = DOMAIN_AREA_ORDER.indexOf(left.key as (typeof DOMAIN_AREA_ORDER)[number]);
      const rightIndex = DOMAIN_AREA_ORDER.indexOf(right.key as (typeof DOMAIN_AREA_ORDER)[number]);
      const normalizedLeftIndex = leftIndex === -1 ? DOMAIN_AREA_ORDER.length : leftIndex;
      const normalizedRightIndex = rightIndex === -1 ? DOMAIN_AREA_ORDER.length : rightIndex;
      if (normalizedLeftIndex !== normalizedRightIndex) {
        return normalizedLeftIndex - normalizedRightIndex;
      }
      return left.label.localeCompare(right.label);
    });
}

export function buildCropRowSubtitle(input: {
  crop: CropSummary;
  fieldLabel?: string;
  cropGroupLabel?: string;
}): string {
  const parts = [input.crop.variety || 'No variety'];
  parts.push(input.fieldLabel || 'No field');
  parts.push(input.cropGroupLabel ? `Group ${input.cropGroupLabel}` : 'Standalone operations');
  return parts.join(' · ');
}

export function buildCropOverviewCells(input: {
  crop: CropSummary;
  fieldLabel?: string;
  cropGroupLabel?: string;
  enabledPracticeCount: number;
}): InfoGridCell[] {
  return [
    { label: 'Status', value: formatCropStatusLabel(input.crop.status) },
    { label: 'Field', value: input.fieldLabel || 'No field' },
    { label: 'Operations', value: String(input.enabledPracticeCount) },
    { label: 'Group', value: input.cropGroupLabel || 'Standalone' },
  ];
}

export function buildCycleRowSubtitle(cycle: ProductionCycleSummary): string {
  return [
    cycle.fieldName || cycle.fieldId,
    cycle.lotName || cycle.lotId,
    `${formatDate(cycle.startDate)} -> ${cycle.endDate ? formatDate(cycle.endDate) : 'Open'}`,
  ].join(' · ');
}

export function buildCycleOverviewCells(cycle: ProductionCycleSummary): InfoGridCell[] {
  return [
    { label: 'Status', value: formatCropStatusLabel(cycle.status) },
    { label: 'Field', value: cycle.fieldName || cycle.fieldId },
    { label: 'Lot', value: cycle.lotName || cycle.lotId },
    { label: 'Actual Cost', value: formatMoney(cycle.actualCost) },
  ];
}

export function buildOperationRowSubtitle(operation: ProductionCycleOperationSummary): string {
  const costLabel = formatMoney(operation.cost);
  return [formatDate(operation.date), formatOperationFamilyLabel(operation.type), costLabel].join(' · ');
}

export function buildOperationChips(
  operation: ProductionCycleOperationSummary,
): Array<{ label: string; value: string }> {
  return [
    { label: 'Status', value: formatCropStatusLabel(operation.status) },
    {
      label: 'Practice',
      value: operation.practiceId ? 'Mapped' : 'Manual',
    },
  ];
}
