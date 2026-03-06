import type { ManagedContact } from '../api/modules/management';

export type ContactFormValues = {
  name: string;
  type: string;
  contactTypesCsv: string;
  status: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  country: string;
  cityRegion: string;
  taxId: string;
};

export const CONTACT_TYPE_OPTIONS = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'customer', label: 'Customer' },
  { value: 'other', label: 'Other' },
] as const;

export const CONTACT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export function parseCsvValues(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function toContactFormValues(contact?: ManagedContact | null): ContactFormValues {
  if (!contact) {
    return {
      name: '',
      type: 'supplier',
      contactTypesCsv: 'supplier',
      status: 'active',
      email: '',
      phone: '',
      company: '',
      address: '',
      notes: '',
      country: '',
      cityRegion: '',
      taxId: '',
    };
  }

  return {
    name: contact.name,
    type: contact.type ?? 'other',
    contactTypesCsv: contact.contactTypes.join(', '),
    status: contact.status,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    company: contact.company ?? '',
    address: contact.address ?? '',
    notes: contact.notes ?? '',
    country: contact.country ?? '',
    cityRegion: contact.cityRegion ?? '',
    taxId: contact.taxId ?? '',
  };
}
