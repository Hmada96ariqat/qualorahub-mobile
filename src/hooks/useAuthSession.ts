import { useAuth } from '../providers/AuthProvider';

export function useAuthSession() {
  return useAuth();
}
