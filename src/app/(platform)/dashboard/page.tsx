'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWorker } from '@/app/_actions/worker-actions';
import { getJobs } from '@/app/_actions/job-actions';
import { getTierBadgeClasses, TIER_REQUIREMENTS, CATEGORIES, CategoryKey } from '@/lib/tiers';
import { shortenAddress, formatEth, cn } from '@/lib/utils';

interface Worker {
  wallet_address: string;
  name: string | null;
  tier: number;
  category: string | null;
  subcategory: string | null;
  location: string | null;
  quality_score: number;
  completion_rate: number;
  tdlr_verified: boolean;
}

export default function DashboardPage() {
  const { authenticated, login, ready } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets?.[0]?.address || '';
  const [worker, setWorker] = useState<Worker | null>(null);
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authenticated && walletAddress) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [authenticated, walletAddress]);

  async function loadData() {
    const [workerRes, jobsRes] = await Promise.all([
      getWorker(walletAddress),
      getJobs({ status: 'open' }),
    ]);
    if (workerRes.success) setWorker(workerRes.data as Worker);
    if (jobsRes.success) setJobs(jobsRes.data || []);
    setLoading(false);
  }

  if (!ready || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Your Dashboard</h1>
        <p className="text-stone-600 mb-6">Connect your wallet to see your profile, active jobs, and next steps.</p>
        <button onClick={login} className="px-6 py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Welcome to Trailmark</h1>
        <p className="text-stone-600 mb-6">You haven&apos;t set up your worker profile yet. Let&apos;s get you started.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/onboarding" className="px-6 py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800">
            Start Onboarding
          </Link>
          <Link href="/jobs" className="px-6 py-3 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50">
            Browse Jobs First
          </Link>
        </div>
      </div>
    );
  }

  const tierInfo = TIER_REQUIREMENTS[worker.tier];
  const nextTier = worker.tier < 4 ? TIER_REQUIREMENTS[worker.tier + 1] : null;
  const categoryLabel = worker.category ? CATEGORIES[worker.category as CategoryKey]?.label : null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Dashboard</h1>

      {/* Profile Card */}
      <div className="border border-stone-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
            {worker.name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-stone-900">{worker.name || 'Unnamed Worker'}</h2>
              <span className={getTierBadgeClasses(worker.tier)}>
                Tier {worker.tier}: {tierInfo.name}
              </span>
            </div>
            <p className="text-sm text-stone-500">{shortenAddress(worker.wallet_address)}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
              {categoryLabel && <span>{categoryLabel} — {worker.subcategory?.replace(/_/g, ' ')}</span>}
              {worker.location && <span>{worker.location}</span>}
            </div>
          </div>
          <Link href={`/profile?address=${worker.wallet_address}`} className="text-xs text-emerald-700 hover:underline">
            View Full Profile
          </Link>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-stone-900">{worker.completion_rate}%</div>
            <div className="text-xs text-stone-500">Completion</div>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-stone-900">{worker.quality_score}</div>
            <div className="text-xs text-stone-500">Quality</div>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-emerald-700">{worker.tier}</div>
            <div className="text-xs text-stone-500">Current Tier</div>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-stone-900">{tierInfo.jobAccess}</div>
            <div className="text-xs text-stone-500">Job Access</div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Tier Roadmap */}
        {nextTier && (
          <div className="border border-stone-200 rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3">Next Tier: {nextTier.name}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Jobs completed</span>
                <span className="font-medium">{nextTier.jobs} needed</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Quality score</span>
                <span className="font-medium">{nextTier.qualityScore}+ needed</span>
              </div>
              {nextTier.licenseRequired && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">License</span>
                  <span className={cn('font-medium', worker.tdlr_verified ? 'text-green-600' : 'text-amber-600')}>
                    {worker.tdlr_verified ? 'Verified' : 'Required'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Bond coverage</span>
                <span className="font-medium">{nextTier.bondCoverage}</span>
              </div>
            </div>
            <Link href="/pathfinder" className="inline-block mt-3 text-xs text-emerald-700 hover:underline">
              Get personalized roadmap with Pathfinder &rarr;
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border border-stone-200 rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/jobs" className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors">
              <span className="h-8 w-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-sm font-bold">J</span>
              <div>
                <div className="text-sm font-medium text-stone-900">Browse Jobs</div>
                <div className="text-xs text-stone-500">{jobs.length} open jobs available</div>
              </div>
            </Link>
            <Link href="/scout" className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <span className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-sm font-bold">S</span>
              <div>
                <div className="text-sm font-medium text-stone-900">Scout RFPs</div>
                <div className="text-xs text-stone-500">Paste a city RFP, get plain-language breakdown</div>
              </div>
            </Link>
            <Link href="/onboarding" className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
              <span className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-700 text-sm font-bold">T</span>
              <div>
                <div className="text-sm font-medium text-stone-900">Chat with Trailblazer</div>
                <div className="text-xs text-stone-500">AI onboarding assistant</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Open Jobs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Open Jobs</h3>
          <Link href="/jobs" className="text-xs text-emerald-700 hover:underline">View all</Link>
        </div>
        {jobs.length === 0 ? (
          <p className="text-sm text-stone-500 py-4 text-center">No open jobs right now.</p>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 3).map((j: Record<string, unknown>, i) => (
              <Link key={i} href={`/jobs/${j.id}`} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg hover:border-stone-300 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{j.title as string}</div>
                  <div className="text-xs text-stone-500">{(j.category as string)?.replace(/_/g, ' ')} · {(j.location as string) || 'Fort Worth'}</div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-sm font-medium text-emerald-700">{formatEth(j.budget_eth as number)}</div>
                  <span className={getTierBadgeClasses(j.tier_required as number)}>T{j.tier_required as number}+</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
