import type { ManagedInvite, ManagedRole, ManagedUser } from '../../../api/modules/management';
import {
  toInviteDisplayName,
  toInviteRowSubtitle,
  toManagementDateLabel,
  toManagementStatusVariant,
  toRoleRowSubtitle,
  toUserDisplayName,
  toUserRowSubtitle,
} from '../managementPresentation';

const sampleUser: ManagedUser = {
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
  updatedAt: '2026-03-02T00:00:00.000Z',
};

const sampleRole: ManagedRole = {
  id: 'role-1',
  name: 'Supervisor',
  status: 'active',
  description: null,
  linkedFields: ['field-1'],
  permissions: [
    {
      id: 'perm-1',
      module: 'users',
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: false,
    },
  ],
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-02T00:00:00.000Z',
};

const sampleInvite: ManagedInvite = {
  id: 'invite-1',
  email: 'invite@example.test',
  status: 'pending',
  fullName: 'Invite User',
  roleId: 'role-1',
  expiresAt: '2026-03-04T00:00:00.000Z',
  createdAt: '2026-03-01T00:00:00.000Z',
};

describe('managementPresentation', () => {
  it('formats user presentation labels', () => {
    expect(toUserDisplayName(sampleUser)).toBe('Admin User');
    expect(toUserRowSubtitle(sampleUser)).toBe('Admin · admin@example.test');
  });

  it('formats role and invite row subtitles', () => {
    expect(toRoleRowSubtitle(sampleRole)).toBe('1 permissions · 1 linked fields');
    expect(toInviteDisplayName(sampleInvite)).toBe('Invite User');
    expect(toInviteRowSubtitle(sampleInvite)).toBe(
      'invite@example.test · Expires Mar 4, 2026',
    );
  });

  it('maps statuses and dates to stable management labels', () => {
    expect(toManagementStatusVariant('active')).toBe('success');
    expect(toManagementStatusVariant('pending')).toBe('warning');
    expect(toManagementDateLabel('2026-03-02T00:00:00.000Z')).toBe('Mar 2, 2026');
  });
});
