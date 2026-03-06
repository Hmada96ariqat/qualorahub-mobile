import type {
  AnimalRecord,
  HousingUnit,
  WeatherAlertRule,
} from '../../api/modules/livestock';
import type { DotBadgeVariant, InfoGridCell, ListRowIconVariant } from '../../components';

export function formatLivestockStatusLabel(value: string | null | undefined): string {
  const normalized = (value ?? '').trim();
  if (!normalized) return 'Unknown';
  return normalized.replaceAll('_', ' ');
}

export function toLivestockStatusBadgeVariant(
  value: string | null | undefined,
): DotBadgeVariant {
  const normalized = (value ?? '').trim().toLowerCase();
  if (
    normalized === 'active' ||
    normalized === 'enabled' ||
    normalized === 'healthy' ||
    normalized === 'done' ||
    normalized === 'ok'
  ) {
    return 'success';
  }
  if (
    normalized === 'inactive' ||
    normalized === 'disabled' ||
    normalized === 'under_maintenance' ||
    normalized === 'scheduled'
  ) {
    return 'warning';
  }
  if (normalized === 'high') {
    return 'destructive';
  }
  if (normalized === 'medium' || normalized === 'in_progress') {
    return 'warning';
  }
  return 'neutral';
}

export function toLivestockRowIconVariant(
  value: string | null | undefined,
): ListRowIconVariant {
  const variant = toLivestockStatusBadgeVariant(value);
  if (variant === 'success') return 'green';
  if (variant === 'warning' || variant === 'destructive') return 'amber';
  return 'neutral';
}

export function buildAnimalRowSubtitle(input: {
  animal: AnimalRecord;
  housingLabel?: string;
}): string {
  const parts = [input.animal.species ?? 'Unknown species'];
  parts.push(input.animal.tagNumber ? `Tag ${input.animal.tagNumber}` : 'No tag');
  parts.push(input.housingLabel || 'No housing');
  return parts.join(' · ');
}

export function buildAnimalOverviewCells(input: {
  animal: AnimalRecord;
  housingLabel?: string;
}): InfoGridCell[] {
  return [
    { label: 'Status', value: formatLivestockStatusLabel(input.animal.activeStatus) },
    { label: 'Health', value: formatLivestockStatusLabel(input.animal.healthStatus) },
    { label: 'Housing', value: input.housingLabel || 'No housing' },
    {
      label: 'Quantity',
      value: input.animal.quantity === null ? 'n/a' : String(input.animal.quantity),
    },
  ];
}

export function buildHousingRowSubtitle(input: {
  housingUnit: HousingUnit;
  fieldLabel?: string;
}): string {
  const parts = [input.housingUnit.unitCode ? `Code ${input.housingUnit.unitCode}` : 'No code'];
  parts.push(input.fieldLabel || 'No field');
  parts.push(
    input.housingUnit.capacity === null ? 'No capacity' : `Capacity ${input.housingUnit.capacity}`,
  );
  return parts.join(' · ');
}

export function buildHousingOverviewCells(input: {
  housingUnit: HousingUnit;
  fieldLabel?: string;
}): InfoGridCell[] {
  return [
    { label: 'Status', value: formatLivestockStatusLabel(input.housingUnit.currentStatus) },
    { label: 'Field', value: input.fieldLabel || 'No field assigned' },
    {
      label: 'Capacity',
      value: input.housingUnit.capacity === null ? 'n/a' : String(input.housingUnit.capacity),
    },
    {
      label: 'Animal Types',
      value: input.housingUnit.animalTypes.length > 0 ? input.housingUnit.animalTypes.join(', ') : 'n/a',
    },
  ];
}

export function buildWeatherRowSubtitle(input: {
  weatherRule: WeatherAlertRule;
  lotLabel?: string;
  fieldLabel?: string;
}): string {
  const threshold =
    input.weatherRule.value === null
      ? 'n/a'
      : `${input.weatherRule.value}${input.weatherRule.unit ? ` ${input.weatherRule.unit}` : ''}`;
  return [
    `${input.weatherRule.condition ?? 'condition'} ${input.weatherRule.operator ?? '>='} ${threshold}`.trim(),
    input.lotLabel || 'No lot',
    input.fieldLabel || 'No field',
  ].join(' · ');
}

export function buildWeatherOverviewCells(input: {
  weatherRule: WeatherAlertRule;
  lotLabel?: string;
  fieldLabel?: string;
}): InfoGridCell[] {
  return [
    { label: 'Severity', value: formatLivestockStatusLabel(input.weatherRule.severity) },
    { label: 'Enabled', value: input.weatherRule.enabled ? 'Yes' : 'No' },
    { label: 'Lot', value: input.lotLabel || 'No lot assigned' },
    { label: 'Field', value: input.fieldLabel || 'No field assigned' },
  ];
}
