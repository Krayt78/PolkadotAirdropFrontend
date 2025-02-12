import { useEffect, useState } from 'react';
import { hexToU8a } from '@polkadot/util';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { POLKADOT_NETWORK } from '../config';
import { Bool, Option } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';

export function usePolkadot() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        const wsProvider = new WsProvider('ws://127.0.0.1:9944'); //'ws://127.0.0.1:9944' for test locally // POLKADOT_NETWORK otherwise
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

  async function checkClaim(api: ApiPromise, ethereumAddress: string): Promise<boolean> {

    console.log('Checking claim for:', ethereumAddress);
    const ethAddressBytes = hexToU8a(ethereumAddress.slice(2));
    const testEthAddress = api.createType('EthereumAddress', ethAddressBytes);

    console.log('Ethereum address:', testEthAddress);

    // Query the storage; 
    const claimOpt = await api.query.airdrop.claims<Option<Codec>>(testEthAddress);

    if (claimOpt.isSome) {
      const claim = claimOpt.unwrap();
      console.log(`Claim found: ${claim.toString()}`);
      return true;
    }

    console.log('No claim found');
    return false;
  }

  const checkEligibility = async (address: string) => {
    if (!api) return false;

    try {
      const isEligible = await checkClaim(api, address);
      return isEligible;
    } catch (err) {
      console.error('Failed to check eligibility:', err);
      return false;
    }
  };

  const claim = async (
    address: string,
    signature: string
  ) => {
    if (!api) return false;

    try {
      // Create and send the claim transaction with the correct argument order
      const claimResult = await api.tx.airdrop
        .claim(address, signature)
        .signAndSend();
      return claimResult;
    } catch (err) {
      console.error('Failed to claim:', err);
      return false;
    }
  };

  return { api, isLoading, error, checkEligibility, claim };
}