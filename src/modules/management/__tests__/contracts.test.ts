import {
  parseCsvValues,
  PERMISSION_MODULES,
  resolveAccessState,
  toContactFormValues,
  toRoleFormValues,
  toUserFormValues,
} from '../contracts';

describe('management contracts', () => {
  it('resolves full access for admin role type (bypasses RBAC)', () => {
    expect(
      resolveAccessState({
        roleType: 'admin',
        rbacPermissions: [],
        moduleKey: 'users',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('full');
  });

  it('resolves read-only when RBAC grants view-only permissions', () => {
    expect(
      resolveAccessState({
        roleType: 'custom_role',
        rbacPermissions: [
          { module_key: 'contacts', can_view: true, can_add: false, can_edit: false, can_delete: false },
        ],
        moduleKey: 'contacts',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('read-only');
  });

  it('resolves locked-role when RBAC has no permission record for the module', () => {
    expect(
      resolveAccessState({
        roleType: 'custom_role',
        rbacPermissions: [
          { module_key: 'contacts', can_view: true, can_add: true, can_edit: true, can_delete: true },
        ],
        moduleKey: 'users',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('locked-role');
  });

  it('resolves full when RBAC grants write permissions', () => {
    expect(
      resolveAccessState({
        roleType: 'custom_role',
        rbacPermissions: [
          { module_key: 'contacts', can_view: true, can_add: true, can_edit: true, can_delete: false },
        ],
        moduleKey: 'contacts',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('full');
  });

  it('resolves subscription lock and entitlement read-only mode', () => {
    expect(
      resolveAccessState({
        roleType: 'admin',
        rbacPermissions: [],
        moduleKey: 'contacts',
        menuAllowed: false,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('locked-subscription');

    expect(
      resolveAccessState({
        roleType: 'admin',
        rbacPermissions: [],
        moduleKey: 'notifications',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: true },
      }),
    ).toBe('read-only');
  });

  it('supports backward-compatible roleName parameter', () => {
    expect(
      resolveAccessState({
        roleName: 'admin',
        moduleKey: 'users',
        menuAllowed: true,
        entitlementsSnapshot: { readOnly: false },
      }),
    ).toBe('full');
  });

  it('creates default role form with all modules and no permissions granted', () => {
    const form = toRoleFormValues();
    expect(form.name).toBe('');
    expect(form.permissions).toHaveLength(PERMISSION_MODULES.length);
    // All permissions should default to false
    for (const perm of form.permissions) {
      expect(perm.canView).toBe(false);
      expect(perm.canAdd).toBe(false);
      expect(perm.canEdit).toBe(false);
      expect(perm.canDelete).toBe(false);
    }
  });

  it('populates role form from existing role with permissions', () => {
    const form = toRoleFormValues({
      id: 'role-1',
      name: 'Manager',
      status: 'active',
      description: null,
      linkedFields: [],
      permissions: [
        { id: 'p1', module: 'fields', canView: true, canAdd: true, canEdit: false, canDelete: false },
        { id: 'p2', module: 'tasks', canView: true, canAdd: false, canEdit: true, canDelete: true },
      ],
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });

    expect(form.name).toBe('Manager');
    expect(form.permissions).toHaveLength(PERMISSION_MODULES.length);

    const fieldsPerm = form.permissions.find((p) => p.module === 'fields');
    expect(fieldsPerm).toMatchObject({
      canView: true,
      canAdd: true,
      canEdit: false,
      canDelete: false,
    });

    const tasksPerm = form.permissions.find((p) => p.module === 'tasks');
    expect(tasksPerm).toMatchObject({
      canView: true,
      canAdd: false,
      canEdit: true,
      canDelete: true,
    });

    // Unset modules should default to false
    const dashboardPerm = form.permissions.find((p) => p.module === 'dashboard');
    expect(dashboardPerm).toMatchObject({
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
    });
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
