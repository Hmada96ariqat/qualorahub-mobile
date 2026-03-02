import { httpRequest } from '../../api/client/http';

export type AuthContextResponse = {
  userId?: string;
  email?: string;
  role?: string;
  type?: string;
  farmId?: string | null;
};

export async function getAuthContext(token: string): Promise<AuthContextResponse> {
  return httpRequest<AuthContextResponse>('/auth/context', {
    method: 'GET',
    token,
  });
}
