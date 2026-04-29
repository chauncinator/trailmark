'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { getPathfinderAdvice } from '@/app/_actions/pathfinder-actions';
import { getTierBadgeClasses, TIER_REQUIREMENTS } from '@/lib/tiers';
import Link from 'next/link';

export default function PathfinderPage() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets?.[0]?.address || '';

  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadAdvice() {
    if (!walletAddress) return;
    setLoading(true);
    const res = await getPathfinderAdvice(walletAddress);
    setAdvice(res.content);
    setLoading(false);
  }

  useEffect(() => {
    if (authenticated && walletAddress) {
      loadAdvice();
    }
  }, [authenticated, walletAddress]);

  if (!authenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-amber-700 text-xl font-bold">P</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Pathfinder Agent</h1>
        <p className="text-stone-600 mb-6">Get a personalized career roadmap — specific tier gaps, not generic advice.</p>
        <button
          onClick={login}
          className="px-6 py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800"
        >
          Connect Wallet to Start
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Pathfinder</h1>
        <p className="text-stone-600 mt-1">Your personalized career roadmap in Trailmark Guild</p>
      </div>

      {/* Quick Tier Reference */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {TIER_REQUIREMENTS.map((tier) => (
          <div key={tier.tier} className="text-center p-2 rounded-lg bg-stone-50">
            <span className={getTierBadgeClasses(tier.tier)}>T{tier.tier}</span>
            <div className="text-xs text-stone-500 mt-1">{tier.name}</div>
          </div>
        ))}
      </div>

      <button
        onClick={loadAdvice}
        disabled={loading}
        className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors mb-6"
      >
        {loading ? 'Analyzing your profile...' : 'Get Career Roadmap'}
      </button>

      {advice && (
        <div className="border border-stone-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">P</div>
            <span className="font-medium text-sm">Pathfinder Analysis</span>
          </div>
          <div className="prose prose-sm prose-stone max-w-none whitespace-pre-wrap">
            {advice}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/jobs" className="text-sm text-emerald-700 hover:underline">
          Browse jobs you qualify for &rarr;
        </Link>
      </div>
    </div>
  );
}
