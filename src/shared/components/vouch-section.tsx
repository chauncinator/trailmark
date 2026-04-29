'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createAttestation } from '@/app/_actions/attestation-actions';

export function VouchSection({ workerWallet, workerCategory }: { workerWallet: string; workerCategory: string | null }) {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets?.[0]?.address || '';
  const [stake, setStake] = useState('0');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwnProfile = walletAddress?.toLowerCase() === workerWallet?.toLowerCase();

  if (isOwnProfile) return null;

  async function handleVouch() {
    setLoading(true);
    setError('');
    const res = await createAttestation({
      worker_wallet: workerWallet,
      attester_wallet: walletAddress,
      credential_type: 'PEER_ATTESTATION',
      category: workerCategory || 'general',
      stake_amount: parseFloat(stake) || 0,
    });
    setLoading(false);
    if (res.success) setSubmitted(true);
    else setError(res.error);
  }

  if (!authenticated) {
    return (
      <div className="border border-stone-200 rounded-lg p-4 text-center">
        <p className="text-sm text-stone-500 mb-2">Connect your wallet to vouch for this worker</p>
        <button onClick={login} className="text-sm text-emerald-700 hover:underline">Connect Wallet</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-center">
        <p className="text-sm text-green-700 font-medium">Vouch submitted! Your peer attestation has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="border border-stone-200 rounded-lg p-4">
      <h3 className="font-semibold mb-2">Vouch for this Worker</h3>
      <p className="text-xs text-stone-500 mb-3">
        Your attestation adds to their peer weight and helps them advance tiers.
        You are staking your reputation on their skill.
      </p>
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <div className="flex gap-2">
        <input
          type="number"
          step="0.001"
          value={stake}
          onChange={e => setStake(e.target.value)}
          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
          placeholder="Stake amount (ETH, optional)"
        />
        <button
          onClick={handleVouch}
          disabled={loading}
          className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Vouch'}
        </button>
      </div>
    </div>
  );
}
