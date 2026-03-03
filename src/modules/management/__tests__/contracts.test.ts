import {
  parseCsvValues,
  resolveAccessState,
  toContactFormValues,
  toSettingsFormValues,
  toUserFormValues,
} from '../contracts';

describe('management contracts', () => {
  it('resolves full and read-only module access states', () => {
    expect(
      resolveAccessState({
        roleName: 'admin',
        moduleKey: 'users',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('full');

    expect(
      resolveAccessState({
        roleName: 'viewer',
        moduleKey: 'contacts',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('read-only');

    expect(
      resolveAccessState({
        roleName: 'manager',
        moduleKey: 'users',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('locked-role');
  });

  it('resolves subscription lock and entitlement read-only mode', () => {
    expect(
      resolveAccessState({
        roleName: 'admin',
        moduleKey: 'settings',
        menuAllowed: false,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('locked-subscription');

    expect(
      resolveAccessState({
        roleName: 'admin',
        moduleKey: 'notifications',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: true },
      }),
    ).toBe('read-only');
  });

  it('maps form defaults and csv parsing', () => {
    expect(parseCsvValues(' supplier, customer ,, other ')).toEqual([
      'supplier',
      'customer',
      'other',
    ]);

    expect(
      toContactFormValues({
        id: 'contact-1',
        name: 'Agro Co',
        type: 'supplier',
        contactTypes: ['supplier'],
        company: null,
        phone: '+1',
        email: 'test@example.test',
        address: null,
        notes: 'memo',
        country: 'US',
        cityRegion: 'TX',
        taxId: null,
        status: 'active',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      }),
    ).toMatchObject({
      name: 'Agro Co',
      type: 'supplier',
      contactTypesCsv: 'supplier',
      status: 'active',
      email: 'test@example.test',
      phone: '+1',
      notes: 'memo',
      country: 'US',
      cityRegion: 'TX',
    });

    expect(
      toSettingsFormValues({
        id: 'settings-1',
        farmId: 'farm-1',
        shareToken: null,
        deliveryFee: 1.5,
        includeDeliveryFee: true,
        isActive: true,
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      }),
    ).toEqual({
      deliveryFee: '1.5',
      includeDeliveryFee: true,
      isActive: true,
    });

    expect(
      toUserFormValues({
        id: 'profile-1',
        userId: 'user-1',
        email: 'admin@example.test',
        fullName: 'Admin User',
        nickName: 'Admin',
        mobileNumber: null,
        status: 'active',
        roleId: 'role-1',
        roleName: 'Admin',
        userType: 'regular',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      }),
    ).toEqual({
      fullName: 'Admin User',
      nickName: 'Admin',
      mobileNumber: '',
      roleId: 'role-1',
      status: 'active',
    });
  });
});
