import { apiClient } from '../../client';
import { getAuthContext } from '../auth';

jest.mock('../../client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('getAuthContext', () => {
  const apiClientGetMock = jest.mocked(apiClient.get);

  beforeEach(() => {
    apiClientGetMock.mockReset();
  });

  it('parses farm name and display name from the auth context payload', async () => {
    apiClientGetMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'admin@example.test',
          role: 'admin',
          type: 'regular',
          display_name: 'Admin User',
        },
        role: {
          id: null,
          name: null,
        },
        farm: {
          id: 'farm-1',
          name: 'Green Valley Farm',
        },
      },
      status: 200,
      traceId: 'trace-1',
    });

    await expect(getAuthContext('token-1')).resolves.toEqual({
      userId: 'user-1',
      email: 'admin@example.test',
      displayName: 'Admin User',
      role: 'admin',
      type: 'regular',
      farmId: 'farm-1',
      farmName: 'Green Valley Farm',
    });
  });
});
