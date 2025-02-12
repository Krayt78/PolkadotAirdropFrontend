import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

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

    try {
      const signer = await provider.getSigner();
      
      // Convert the polkadot address to hex format
      const message = polkadotAddress;
      
      // Use personal_sign to match the pallet's signature verification
      const signature = await signer.signMessage(message);
      console.log('Signature:', signature);

      return { signature };
    } catch (error) {
      console.error('Error signing message:', error);
      return null;
    }
  };

  return { account, connect, signMessage };
}