import {
  listManagedContacts,
  type ManagedContact,
  type ManagedContactsPage,
} from '../../api/modules/management';

export const CONTACTS_MAX_PAGE_SIZE = 200;

export type EquipmentContactOption = {
  label: string;
  value: string;
  email: string | null;
};

type ListManagedContactsFn = (
  token: string,
  params: { limit: number; offset: number; search?: string },
) => Promise<ManagedContactsPage>;

function toContactOption(contact: ManagedContact): EquipmentContactOption {
  return {
    label: contact.name || contact.email || 'Contact',
    value: contact.id,
    email: contact.email,
  };
}

export async function loadEquipmentContactOptions(
  token: string,
  listContacts: ListManagedContactsFn = listManagedContacts,
): Promise<EquipmentContactOption[]> {
  const contactsById = new Map<string, ManagedContact>();
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const page = await listContacts(token, {
      limit: CONTACTS_MAX_PAGE_SIZE,
      offset,
    });

    if (page.items.length === 0) {
      break;
    }

    for (const contact of page.items) {
      if (contact.status === 'inactive') {
        continue;
      }
      if (!contactsById.has(contact.id)) {
        contactsById.set(contact.id, contact);
      }
    }

    offset += page.items.length;

    if (page.total > 0) {
      total = page.total;
      continue;
    }

    if (page.items.length < CONTACTS_MAX_PAGE_SIZE) {
      break;
    }
  }

  return Array.from(contactsById.values())
    .map(toContactOption)
    .sort((left, right) => left.label.localeCompare(right.label));
}
