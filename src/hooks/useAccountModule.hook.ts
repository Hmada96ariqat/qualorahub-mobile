import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMySubscription } from '../api/modules/subscriptions';
import { useAuthSession } from './useAuthSession';

const ACCOUNT_SUBSCRIPTION_QUERY_KEY = ['account-subscription'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useAccountModule() {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: ACCOUNT_SUBSCRIPTION_QUERY_KEY,
    queryFn: () => getMySubscription(token ?? ''),
    enabled: Boolean(token),
  });

  return {
    subscription: subscriptionQuery.data ?? null,
    isLoading: subscriptionQuery.isLoading,
    isRefreshing: subscriptionQuery.isFetching,
    errorMessage: subscriptionQuery.error
      ? toErrorMessage(subscriptionQuery.error, 'Failed to load account snapshot.')
      : null,
    refresh: async () => {
      await queryClient.invalidateQueries({
        queryKey: ACCOUNT_SUBSCRIPTION_QUERY_KEY,
      });
    },
  };
}
