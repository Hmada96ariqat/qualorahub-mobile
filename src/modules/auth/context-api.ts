import { getAuthContext as getAuthContextRequest } from '../../api/modules/auth';

export type AuthContextResponse = {
  userId: string;
  email: string;
  role: string;
  type: string;
  farmId: string | null;
};

export async function getAuthContext(token: string): Promise<AuthContextResponse> {
  return getAuthContextRequest(token);
}
