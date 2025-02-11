import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { EIP712_DOMAIN, ADDRESS_TYPE } from '../config';

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);

        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }

        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          setAccount(accounts[0] || null);
        });
      }
    };

    init();
  }, []);

  const connect = async () => {
    if (provider) {
      try {
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const signMessage = async (polkadotAddress: string) => {
    if (!provider || !account) return null;

    const signer = await provider.getSigner();
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = await signer.signTypedData(
      EIP712_DOMAIN,
      ADDRESS_TYPE,
      {
        address: polkadotAddress,
        timestamp,
      }
    );

    return { signature, timestamp };
  };

  return { account, connect, signMessage };
}