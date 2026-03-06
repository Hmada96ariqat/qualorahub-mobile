import type { ManagedContact } from '../../api/modules/management';
import type { DotBadgeVariant, ListRowIconVariant } from '../../components';

function toStartCase(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toContactTypeLabel(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return 'Other';
  if (normalized === 'supplier') return 'Supplier';
  if (normalized === 'customer') return 'Customer';
  return toStartCase(normalized);
}

export function toContactStatusLabel(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return 'Unknown';
  if (normalized === 'active') return 'Active';
  if (normalized === 'inactive') return 'Inactive';
  return toStartCase(normalized);
}

export function toContactStatusVariant(value: string | null | undefined): DotBadgeVariant {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'active') return 'success';
  if (normalized === 'inactive') return 'neutral';
  return 'warning';
}

export function toContactIcon(type: string | null | undefined): string {
  const normalized = type?.trim().toLowerCase();
  if (normalized === 'supplier') return 'truck-delivery-outline';
  if (normalized === 'customer') return 'account-group-outline';
  return 'account-box-outline';
}

export function toContactIconVariant(status: string | null | undefined): ListRowIconVariant {
  return status?.trim().toLowerCase() === 'active' ? 'green' : 'neutral';
}

export function toContactRowSubtitle(contact: ManagedContact): string {
  const segments = [
    toContactTypeLabel(contact.type),
    contact.company?.trim() || null,
    contact.email?.trim() || null,
    contact.phone?.trim() || null,
  ].filter((value): value is string => Boolean(value && value.length > 0));

  return segments.join(' · ');
}

export function toContactLocationLabel(contact: ManagedContact): string {
  const segments = [contact.cityRegion?.trim() || null, contact.country?.trim() || null].filter(
    (value): value is string => Boolean(value && value.length > 0),
  );

  return segments.length > 0 ? segments.join(', ') : 'n/a';
}

export function toContactAddressLabel(contact: ManagedContact): string {
  return contact.address?.trim() || 'n/a';
}

export function toContactTypesLabels(contact: ManagedContact): string[] {
  return contact.contactTypes
    .map((type) => type.trim())
    .filter((type) => type.length > 0)
    .map((type) => toStartCase(type));
}

export function toContactDateLabel(value: string | null | undefined): string {
  if (!value) return 'n/a';
  const dateText = value.includes('T') ? value.slice(0, 10) : value;
  const parsed = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
