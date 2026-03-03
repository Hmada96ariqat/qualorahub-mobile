import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useModuleActionPermissions } from '../useModuleActionPermissions';
import { useAuth } from '../../providers/AuthProvider';

jest.mock('../../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

function Harness({ menuKey = 'fields' }: { menuKey?: string }) {
  const { permissions } = useModuleActionPermissions(menuKey);
  return <Text testID="value">{JSON.stringify(permissions)}</Text>;
}

describe('useModuleActionPermissions', () => {
  const useAuthMock = jest.mocked(useAuth);

  it('reads CRUD flags from RBAC permission records', () => {
    useAuthMock.mockReturnValue({
      accessLoading: false,
      accessSnapshot: {
        rbac: {
          type: 'manager',
          permissions: [
            {
              module_key: 'fields',
              can_view: true,
              can_add: false,
              can_edit: true,
              can_delete: false,
            },
          ],
        },
      },
      hasMenuAccess: () => true,
    } as never);

    const { getByTestId } = render(<Harness />);
    expect(getByTestId('value').props.children).toBe(
      JSON.stringify({ view: true, add: false, edit: true, delete: false }),
    );
  });

  it('grants full access for admin role types', () => {
    useAuthMock.mockReturnValue({
      accessLoading: false,
      accessSnapshot: {
        rbac: {
          type: 'super_admin',
          permissions: [],
        },
      },
      hasMenuAccess: () => true,
    } as never);

    const { getByTestId } = render(<Harness />);
    expect(getByTestId('value').props.children).toBe(
      JSON.stringify({ view: true, add: true, edit: true, delete: true }),
    );
  });

  it('resolves lots menu alias through fields access', () => {
    useAuthMock.mockReturnValue({
      accessLoading: false,
      accessSnapshot: {
        rbac: {
          type: 'manager',
          permissions: [
            {
              module_key: 'lots',
              can_view: true,
              can_add: true,
              can_edit: false,
              can_delete: false,
            },
          ],
        },
      },
      hasMenuAccess: (key: string) => key === 'fields',
    } as never);

    const { getByTestId } = render(<Harness menuKey="lots" />);
    expect(getByTestId('value').props.children).toBe(
      JSON.stringify({ view: true, add: true, edit: false, delete: false }),
    );
  });
});
