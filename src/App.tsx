import React, { useState } from 'react';
import { Wallet, Check, X, Loader2 } from 'lucide-react';
import { useWallet } from './lib/hooks/useWallet';
import { usePolkadot } from './lib/hooks/usePolkadot';

function App() {
  const { account, connect, signMessage } = useWallet();
  const { isLoading: isPolkadotLoading, checkEligibility } = usePolkadot();
  const [polkadotAddress, setPolkadotAddress] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCheck = async () => {
    if (!polkadotAddress) return;
    
    setIsChecking(true);
    try {
      const eligible = await checkEligibility(polkadotAddress);
      setIsEligible(eligible);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setIsEligible(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!account || !polkadotAddress || !isEligible) return;

    setIsSubmitting(true);
    try {
      const result = await signMessage(polkadotAddress);
      if (result) {
        // Here you would typically send this data to your backend
        console.log('Signed message:', result);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Airdrop Eligibility Checker</h1>
            <p className="text-gray-300">Connect your wallet and check if you're eligible for the airdrop</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
            {/* Step 1: Wallet Connection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                Step 1: Connect Wallet
              </h2>
              {!account ? (
                <button
                  onClick={connect}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  disabled={isPolkadotLoading}
                >
                  {isPolkadotLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Initializing...
                    </span>
                  ) : (
                    'Connect Ethereum Wallet'
                  )}
                </button>
              ) : (
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-300">Connected Account:</p>
                  <p className="font-mono">{account}</p>
                </div>
              )}
            </div>

            {/* Step 2: Polkadot Address */}
            {account && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Step 2: Enter Polkadot Address</h2>
                <input
                  type="text"
                  value={polkadotAddress}
                  onChange={(e) => setPolkadotAddress(e.target.value)}
                  placeholder="Enter your Polkadot address"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4 text-white placeholder-gray-400"
                />
                <button
                  onClick={handleCheck}
                  disabled={!polkadotAddress || isChecking}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isChecking ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking Eligibility...
                    </span>
                  ) : (
                    'Check Eligibility'
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Eligibility Result */}
            {isEligible !== null && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Step 3: Eligibility Result</h2>
                <div className={`p-4 rounded-lg ${isEligible ? 'bg-green-900' : 'bg-red-900'} flex items-center gap-3`}>
                  {isEligible ? (
                    <>
                      <Check className="w-6 h-6 text-green-400" />
                      <span>Congratulations! You are eligible for the airdrop.</span>
                    </>
                  ) : (
                    <>
                      <X className="w-6 h-6 text-red-400" />
                      <span>Sorry, you are not eligible for the airdrop.</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Submit */}
            {isEligible && !submitted && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Step 4: Submit Claim</h2>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Claim'
                  )}
                </button>
              </div>
            )}

            {/* Success Message */}
            {submitted && (
              <div className="bg-green-900 p-4 rounded-lg">
                <p className="text-center text-green-100">
                  Your claim has been successfully submitted! You will receive your tokens once the airdrop begins.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;