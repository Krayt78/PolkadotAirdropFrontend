export const POLKADOT_NETWORK = 'wss://rpc.polkadot.io';
export const DOMAIN_NAME = 'Airdrop Eligibility Checker';
export const DOMAIN_VERSION = '1';

export const EIP712_DOMAIN = {
  name: DOMAIN_NAME,
  version: DOMAIN_VERSION,
  chainId: 1, // Ethereum Mainnet
} as const;

export const ADDRESS_TYPE = {
  PolkadotAddress: [
    { name: 'address', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
} as const;