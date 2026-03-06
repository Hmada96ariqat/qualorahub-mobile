import type { ManagedContact, ManagedContactsPage } from '../../../api/modules/management';
import { CONTACTS_MAX_PAGE_SIZE, loadEquipmentContactOptions } from '../contactOptions';

function createContact(
  input: Pick<ManagedContact, 'id'> & Partial<Omit<ManagedContact, 'id'>>,
): ManagedContact {
  return {
    id: input.id,
    name: input.name ?? 'Contact',
    type: input.type ?? null,
    contactTypes: input.contactTypes ?? [],
    company: input.company ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
    country: input.country ?? null,
    cityRegion: input.cityRegion ?? null,
    taxId: input.taxId ?? null,
    status: input.status ?? 'active',
    createdAt: input.createdAt ?? '2026-03-01T00:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-03-01T00:00:00.000Z',
  };
}

describe('equipment contact options', () => {
  it('loads contact pages with the backend max limit and aggregates all pages', async () => {
    const listContacts = jest.fn<
      Promise<ManagedContactsPage>,
      [string, { limit: number; offset: number; search?: string }]
    >();

    listContacts
      .mockResolvedValueOnce({
        items: [createContact({ id: 'contact-2', name: 'Bravo' })],
        total: 2,
        limit: CONTACTS_MAX_PAGE_SIZE,
        offset: 0,
      })
      .mockResolvedValueOnce({
        items: [createContact({ id: 'contact-1', name: 'Alpha' })],
        total: 2,
        limit: CONTACTS_MAX_PAGE_SIZE,
        offset: 1,
      });

    const options = await loadEquipmentContactOptions('token', listContacts);

    expect(listContacts).toHaveBeenNthCalledWith(1, 'token', {
      limit: CONTACTS_MAX_PAGE_SIZE,
      offset: 0,
    });
    expect(listContacts).toHaveBeenNthCalledWith(2, 'token', {
      limit: CONTACTS_MAX_PAGE_SIZE,
      offset: 1,
    });
    expect(options).toEqual([
      { label: 'Alpha', value: 'contact-1', email: null },
      { label: 'Bravo', value: 'contact-2', email: null },
    ]);
  });

  it('filters inactive rows and deduplicates repeated contacts', async () => {
    const listContacts = jest.fn<
      Promise<ManagedContactsPage>,
      [string, { limit: number; offset: number; search?: string }]
    >();

    listContacts.mockResolvedValue({
      items: [
        createContact({ id: 'contact-1', name: 'Charlie' }),
        createContact({ id: 'contact-1', name: 'Charlie Duplicate' }),
        createContact({ id: 'contact-2', name: 'Inactive', status: 'inactive' }),
      ],
      total: 3,
      limit: CONTACTS_MAX_PAGE_SIZE,
      offset: 0,
    });

    const options = await loadEquipmentContactOptions('token', listContacts);

    expect(options).toEqual([{ label: 'Charlie', value: 'contact-1', email: null }]);
  });
});
