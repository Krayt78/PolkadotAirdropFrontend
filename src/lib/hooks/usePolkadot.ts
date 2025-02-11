import { useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { POLKADOT_NETWORK } from '../config';

export function usePolkadot() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        const wsProvider = new WsProvider(POLKADOT_NETWORK);
        const api = await ApiPromise.create({ provider: wsProvider });
        setApi(api);
      } catch (err) {
        setError('Failed to connect to Polkadot network');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    connect();

    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, []);

  const checkEligibility = async (address: string) => {
    if (!api) return false;

    try {
      // This is a placeholder - replace with actual eligibility check logic
      // For example, checking account balance or specific blockchain data
      const accountInfo = await api.query.system.account(address);
      return !accountInfo.isEmpty;
    } catch (err) {
      console.error('Failed to check eligibility:', err);
      return false;
    }
  };

  return { api, isLoading, error, checkEligibility };
}