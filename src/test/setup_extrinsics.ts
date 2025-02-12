import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { u8aConcat, stringToU8a, hexToU8a } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import BN from 'bn.js';

async function main() {
  let api: ApiPromise | undefined;
  try {
    console.log('Connecting to node...');
    // Wait for crypto to be ready
    await cryptoWaitReady();

    // Connect to your local node (adjust the endpoint if needed)
    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    api = await ApiPromise.create({
      provider: wsProvider,
      types: {
        EthereumAddress: '[u8; 20]',
        EcdsaSignature: '[u8; 65]'
      }
    });
    console.log('Connected to node');

    // Create a keyring instance and add the sudo account (typically Alice in dev chains)
    const keyring = new Keyring({ type: 'sr25519' });
    const sudoKey = keyring.addFromUri('//Alice');
    console.log('Alice address:', sudoKey.address);
    const aliceBalance = await api.query.system.account(sudoKey.address);
    console.log('\nAlice balance:', aliceBalance.toString());

    // Get the pallet account ID
    const modlPrefix = stringToU8a('modl');
    const palletIdBytes = stringToU8a('airdrop!');
    const accountIdU8a = u8aConcat(modlPrefix, palletIdBytes, new Uint8Array(32 - modlPrefix.length - palletIdBytes.length));
    const palletAccount = keyring.encodeAddress(accountIdU8a);
    console.log('\nPallet account:', palletAccount);
    const palletBalance = await api.query.system.account(palletAccount);
    console.log('Initial pallet balance:', palletBalance.toString());

    // Fund the pallet account with some tokens
    console.log('\nFunding pallet account...');
    const fundAmount = new BN('100');
    const transferCall = api.tx.balances.transferAllowDeath(palletAccount, fundAmount);
    
    await new Promise((resolve, reject) => {
      let unsubscribe: (() => void) | undefined;
      transferCall.signAndSend(sudoKey, (result) => {
        console.log('Transfer status:', result.status.toString());
        if (result.status.isInBlock || result.status.isFinalized) {
          if (unsubscribe) {
            unsubscribe();
          }
          resolve(undefined);
        }
      }).then(unsub => {
        unsubscribe = unsub;
      }).catch(error => {
        console.error('Error transferring:', error);
        reject(error);
      });
    });

    const palletBalanceAfter = await api.query.system.account(palletAccount);
    console.log('Pallet balance after transfer:', palletBalanceAfter.toString());

    // Register a claim for 0x79933Da2de793DFC61c90017884C253B9BDF8B90
    console.log('\nRegistering claim...');
    const claimAmount = new BN('10');
    const ethAddressHex = '0x79933Da2de793DFC61c90017884C253B9BDF8B90';
    const ethAddressBytes = hexToU8a(ethAddressHex.slice(2));
    const testEthAddress = api.createType('EthereumAddress', ethAddressBytes);
    console.log('Ethereum address:', testEthAddress.toHex());
    const claimCall = api.tx.airdrop.registerClaim(testEthAddress, claimAmount);
    const sudoCall = api.tx.sudo.sudo(claimCall);

    await new Promise((resolve, reject) => {
      let unsubscribe: (() => void) | undefined;
      sudoCall.signAndSend(sudoKey, ({ status, events = [] }) => {
        console.log('Claim registration status:', status.toString());
        if (status.isInBlock || status.isFinalized) {
          events.forEach(({ event }) => {
            if (api?.events.system.ExtrinsicSuccess.is(event)) {
              console.log('Claim registration succeeded');
            } else if (api?.events.system.ExtrinsicFailed.is(event)) {
              console.error('Claim registration failed');
              const [dispatchError] = event.data;
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                console.error(`Module error: ${decoded.section}.${decoded.name}`);
              } else {
                console.error('Other error:', dispatchError.toString());
              }
            }
          });
          if (unsubscribe) {
            unsubscribe();
          }
          resolve(undefined);
        }
      }).then(unsub => {
        unsubscribe = unsub;
      }).catch(error => {
        console.error('Error registering claim:', error);
        reject(error);
      });
    });

    // Check the claim for 0x79933Da2de793DFC61c90017884C253B9BDF8B90
    console.log('\nChecking claim...');
    const registeredClaim = await api.query.airdrop.claims(testEthAddress);
    console.log('Claim for address', ethAddressHex, ':', registeredClaim.toString());

    // Check total claims
    const total = await api.query.airdrop.total();
    console.log('Total claims:', total.toString());

    // List all claims
    console.log('\nAll claims:');
    const entries = await api.query.airdrop.claims.entries();
    entries.forEach(([key, value]) => {
      console.log('Address:', key.args[0].toHex(), 'Amount:', value.toString());
    });

    // Check pallet balance again
    const finalPalletBalance = await api.query.system.account(palletAccount);
    console.log('\nFinal pallet balance:', finalPalletBalance.toString());

    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  } finally {
    if (api) {
      console.log('Disconnecting from node...');
      await api.disconnect();
      console.log('Disconnected from node');
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cryptoWaitReady().then(() => {
    main()
      .catch(console.error)
      .finally(() => process.exit());
  });
}

export { main };
