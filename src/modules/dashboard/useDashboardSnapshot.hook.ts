import { useQuery } from '@tanstack/react-query';
import { getDashboardSnapshot } from '../../api/modules/dashboard';
import { useAuthSession } from '../../hooks/useAuthSession';

const DASHBOARD_SNAPSHOT_QUERY_KEY = ['dashboard', 'snapshot'] as const;

export function useDashboardSnapshot() {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;

  const query = useQuery({
    queryKey: DASHBOARD_SNAPSHOT_QUERY_KEY,
    queryFn: () => getDashboardSnapshot(token ?? ''),
    enabled: Boolean(token),
    staleTime: 45_000,
    gcTime: 5 * 60_000,
    refetchOnReconnect: true,
  });

  return {
    snapshot: query.data ?? null,
    loading: query.isLoading,
    refreshing: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: query.refetch,
  };
}
