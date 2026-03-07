import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus(): boolean | null {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInitialState() {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!active) {
          return;
        }

        setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
      } catch {
        if (!active) {
          return;
        }

        setIsOnline(null);
      }
    }

    void loadInitialState();

    const subscription = Network.addNetworkStateListener((state) => {
      if (!active) {
        return;
      }

      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return isOnline;
}
