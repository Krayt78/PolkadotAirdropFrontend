import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { ethers } from 'ethers';

// Types
interface TransactionStatus {
  status: {
    type: string;
    isInBlock: boolean;
    isFinalized: boolean;
    isInvalid: boolean;
    asInBlock: { toHex: () => string };
    asFinalized: { toHex: () => string };
  };
  events: Array<{
    event: {
      data: any;
      method: string;
      section: string;
    };
  }>;
  dispatchError?: {
    isModule: boolean;
    asModule: any;
    toString: () => string;
  };
}

// Constants
const NODE_URL = 'ws://127.0.0.1:9944';
const TRANSACTION_TIMEOUT = 30000; // 30 seconds
const CUSTOM_TYPES = {
  EthereumAddress: 'H160',
  EcdsaSignature: '[u8; 65]'
};
const TEST_PRIVATE_KEY = '9116d6c6a9c830c06af62af6d4101b566e2466d88510b6c11d655545c74790a4';

// Helper functions
async function connectToNode(): Promise<ApiPromise> {
  console.log('Connecting to node...');
  const provider = new WsProvider(NODE_URL);
  const api = await ApiPromise.create({ 
    provider,
    types: CUSTOM_TYPES
  });
  console.log('Connected to node');
  return api;
}

async function createTestAccount() {
  const keyring = new Keyring({ type: 'sr25519' });
  const testAccount = keyring.addFromUri('//Alice');
  console.log('Test account:', testAccount.address);
  return testAccount;
}

async function generateSignature(api: ApiPromise, testAccount: any) {
  // Create an Ethereum wallet with known private key
  const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);
  const ethAddress = wallet.address;
  console.log('Test account ETH:', ethAddress);

  // Check if address is eligible for claim
  const claimOpt = await api.query.airdrop.claims(ethAddress);
  console.log('Claim option:', claimOpt.toString());
  
  if (claimOpt.isNone) {
    throw new Error('No claim found for address');
  }

  const amount = claimOpt.unwrap();
  console.log('Eligible for claim amount:', amount.toString());

  // Get initial balance
  const { data: balance } = await api.query.system.account(testAccount.address);
  console.log('Initial balance:', balance.free.toString());

  // Create message to sign
  const message = testAccount.address;
  console.log('Message to sign (hex):', message);
  
  // Sign the message
  const signature = await wallet.signMessage(message);
  console.log('Signature:', signature);
  
  // Convert signature to bytes
  const signatureU8a = ethers.getBytes(signature);
  console.log('Signature bytes:', Buffer.from(signatureU8a).toString('hex'));

  return { signatureU8a, ethAddress, amount };
}

async function submitTransaction(api: ApiPromise, testAccount: any, signatureU8a: Uint8Array): Promise<void> {
  const tx = api.tx.airdrop.claim(testAccount.address, signatureU8a);
  console.log('Transaction created');

  return new Promise((resolve, reject) => {
    let unsub: (() => void) | undefined;
    
    const cleanup = () => {
      if (unsub) {
        unsub();
        unsub = undefined;
      }
    };

    const handleTransactionEvents = (event: { event: { data: any; method: string; section: string } }) => {
      const { data, method, section } = event.event;
      console.log('Event:', section, method, data.toString());
      
      if (section === 'airdrop' && method === 'Claimed') {
        console.log('Claim event found:', data.toString());
      }
    };

    const handleTransactionStatus = ({ status, events = [], dispatchError }: TransactionStatus) => {
      try {
        console.log('Transaction status:', status.type);

        if (dispatchError) {
          const error = dispatchError.isModule
            ? api.registry.findMetaError(dispatchError.asModule)
            : new Error(dispatchError.toString());
            
          throw error;
        }

        if (status.isInBlock) {
          console.log('Transaction included in block:', status.asInBlock.toHex());
          events.forEach(handleTransactionEvents);
        } else if (status.isFinalized) {
          console.log('Transaction finalized:', status.asFinalized.toHex());
          cleanup();
          resolve();
        } else if (status.isInvalid) {
          throw new Error('Transaction is invalid');
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    tx.send(handleTransactionStatus)
      .then(unsubFn => {
        unsub = unsubFn;
      })
      .catch(error => {
        console.error('Error in signAndSend:', error);
        cleanup();
        reject(error);
      });
  });
}

async function main() {
  let api: ApiPromise | undefined;
  api = await connectToNode();
  
  try {
    // Initialize cryptography
    await cryptoWaitReady();

    // Connect to node and setup account
    const testAccount = await createTestAccount();

    // Generate signature and get claim details
    const { signatureU8a } = await generateSignature(api, testAccount);

    // Submit and monitor transaction
    console.log('Submitting claim...');
    await Promise.race([
      submitTransaction(api, testAccount, signatureU8a),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Transaction timeout after ${TRANSACTION_TIMEOUT/1000} seconds`)), 
        TRANSACTION_TIMEOUT)
      )
    ]);

  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    // Cleanup and disconnect
    if (api) {
      console.log('Disconnecting from node...');
      await api.disconnect();
      console.log('Disconnected from node');
    }
  }
}

// Run the test
main().catch(console.error);
