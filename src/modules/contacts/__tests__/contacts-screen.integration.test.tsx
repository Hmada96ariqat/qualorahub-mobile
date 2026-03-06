import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type { CreateManagedContactRequest, ManagedContact } from '../../../api/modules/management';
import { useAuth } from '../../../providers/AuthProvider';
import { useManagedContacts } from '../../../hooks/useManagedContacts.hook';
import { ContactsScreen } from '../screens/ContactsScreen';

jest.mock('../../../hooks/useManagedContacts.hook', () => ({
  useManagedContacts: jest.fn(),
}));

jest.mock('../../../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <ContactsScreen />
    </ToastProvider>,
  );
}

describe('ContactsScreen integration', () => {
  const useManagedContactsMock = jest.mocked(useManagedContacts);
  const useAuthMock = jest.mocked(useAuth);

  const activeContact: ManagedContact = {
    id: 'contact-1',
    name: 'Supplier A',
    type: 'supplier',
    contactTypes: ['supplier', 'customer'],
    company: 'Acme Supply',
    phone: '+1-555-0100',
    email: 'supplier@example.test',
    address: '123 Farm Road',
    notes: 'Top supplier',
    country: 'Jordan',
    cityRegion: 'Amman',
    taxId: 'TAX-1',
    status: 'active',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  const inactiveContact: ManagedContact = {
    ...activeContact,
    id: 'contact-2',
    name: 'Customer B',
    type: 'customer',
    company: 'Fresh Market',
    status: 'inactive',
  };

  const createContactMock = jest
    .fn<Promise<ManagedContact>, [CreateManagedContactRequest]>()
    .mockResolvedValue(activeContact);
  const updateContactMock = jest
    .fn<Promise<ManagedContact>, [string, Partial<CreateManagedContactRequest>]>()
    .mockResolvedValue(activeContact);

  function buildHookResult(overrides: Partial<ReturnType<typeof useManagedContacts>> = {}) {
    return {
      contactsPage: {
        items: [activeContact],
        total: 1,
        limit: 10,
        offset: 0,
      },
      summaryCounts: {
        all: 2,
        active: 1,
        inactive: 1,
      },
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      errorMessage: null,
      refresh: async () => undefined,
      createContact: createContactMock,
      updateContact: updateContactMock,
      ...overrides,
    };
  }

  beforeEach(() => {
    createContactMock.mockClear();
    updateContactMock.mockClear();

    useManagedContactsMock.mockImplementation(({ statusFilter }) => {
      if (statusFilter === 'inactive') {
        return buildHookResult({
          contactsPage: {
            items: [inactiveContact],
            total: 1,
            limit: 10,
            offset: 0,
          },
        });
      }

      if (statusFilter === 'all') {
        return buildHookResult({
          contactsPage: {
            items: [activeContact, inactiveContact],
            total: 2,
            limit: 10,
            offset: 0,
          },
        });
      }

      return buildHookResult();
    });

    useAuthMock.mockReturnValue({
      session: null,
      loading: false,
      accessLoading: false,
      accessSnapshot: {
        context: {
          userId: 'user-1',
          email: 'admin@example.test',
          displayName: 'Admin User',
          role: 'admin',
          type: 'regular',
          farmId: 'farm-1',
          farmName: 'Green Valley Farm',
        },
        rbac: null,
        entitlements: {
          readOnly: false,
        },
        menus: [],
      },
      sessionNotice: null,
      signIn: async () => undefined,
      signOut: async () => undefined,
      clearSessionNotice: () => undefined,
      hasMenuAccess: () => true,
    });
  });

  it('defaults the contacts filter to active and updates the hook when the tab changes', async () => {
    const { getByText, queryByText } = renderScreen();

    expect(useManagedContactsMock).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      statusFilter: 'active',
    });
    expect(getByText('Supplier A')).toBeTruthy();
    expect(queryByText('Customer B')).toBeNull();

    fireEvent.press(getByText('Inactive (1)'));

    await waitFor(() => {
      expect(useManagedContactsMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        search: '',
        statusFilter: 'inactive',
      });
      expect(getByText('Customer B')).toBeTruthy();
    });
  });

  it('opens the equipment-style detail sheet for a contact', async () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('contacts-row-contact-1'));

    await waitFor(() => {
      expect(getByText('Directory Details')).toBeTruthy();
      expect(getByText('Contact Types')).toBeTruthy();
      expect(getByText('Edit')).toBeTruthy();
    });
  });

  it('creates a contact via the standalone contacts module with the existing payload contract', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('contacts-header-create'));

    fireEvent.changeText(getByPlaceholderText('Contact name'), ' Supplier A ');
    fireEvent.changeText(getByPlaceholderText('supplier, customer'), ' supplier, customer ');

    fireEvent.press(getByText('Create'));

    await waitFor(() =>
      expect(createContactMock).toHaveBeenCalledWith({
        name: 'Supplier A',
        type: 'supplier',
        contact_types: ['supplier', 'customer'],
        status: 'active',
        email: undefined,
        phone: undefined,
        company: undefined,
        address: undefined,
        notes: undefined,
        country: undefined,
        city_region: undefined,
        tax_id: undefined,
      }),
    );
  });
});
