'use client';

import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { getJob, applyToJob, getJobApplications, acceptWorker, fundEscrow, confirmMilestone } from '@/app/_actions/job-actions';
import { getTierBadgeClasses, TIER_REQUIREMENTS } from '@/lib/tiers';
import { formatEth, shortenAddress, cn } from '@/lib/utils';
import Link from 'next/link';

interface Milestone {
  id: string;
  index: number;
  name: string;
  description: string | null;
  amount_eth: number;
  status: string;
  completed_at: string | null;
  tx_hash: string | null;
}

interface Application {
  id: string;
  worker_wallet: string;
  cover_note: string | null;
  status: string;
  created_at: string;
}

interface Job {
  id: string;
  client_wallet: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  budget_eth: number;
  tier_required: number;
  location: string | null;
  status: string;
  worker_wallet: string | null;
  contract_address: string | null;
  milestones: Milestone[];
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets?.[0]?.address || '';
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [coverNote, setCoverNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [paramsId, setParamsId] = useState('');

  useEffect(() => {
    params.then(p => setParamsId(p.id));
  }, [params]);

  useEffect(() => {
    if (!paramsId) return;
    loadData();
  }, [paramsId]);

  async function loadData() {
    const res = await getJob(paramsId);
    if (res.success) {
      setJob(res.data as Job);
      if (res.data.status === 'open') {
        const apps = await getJobApplications(paramsId);
        if (apps.success) setApplications(apps.data as Application[]);
      }
    }
    setLoading(false);
  }

  const isClient = job?.client_wallet === walletAddress;
  const isWorker = job?.worker_wallet === walletAddress;
  const hasApplied = applications.some(a => a.worker_wallet === walletAddress);

  async function handleApply() {
    setActionLoading(true);
    setError('');
    const res = await applyToJob(paramsId, walletAddress, coverNote);
    setActionLoading(false);
    if (res.success) {
      await loadData();
    } else {
      setError(res.error);
    }
  }

  async function handleAccept(workerWallet: string) {
    setActionLoading(true);
    const res = await acceptWorker(paramsId, workerWallet);
    setActionLoading(false);
    if (res.success) await loadData();
  }

  async function handleFund() {
    setActionLoading(true);
    const res = await fundEscrow(paramsId);
    setActionLoading(false);
    if (res.success) await loadData();
  }

  async function handleConfirmMilestone(milestoneId: string) {
    setActionLoading(true);
    const res = await confirmMilestone(paramsId, milestoneId);
    setActionLoading(false);
    if (res.success) await loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500">Job not found</p>
        <Link href="/jobs" className="text-emerald-700 hover:underline mt-2 inline-block">Back to jobs</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/jobs" className="text-sm text-stone-500 hover:text-stone-700 mb-4 inline-block">
        &larr; Back to jobs
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{job.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-stone-500">{job.category.replace(/_/g, ' ')}</span>
            {job.subcategory && <span className="text-sm text-stone-400">· {job.subcategory.replace(/_/g, ' ')}</span>}
            {job.location && <span className="text-sm text-stone-400">· {job.location}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-700">{formatEth(job.budget_eth)}</div>
          <span className={getTierBadgeClasses(job.tier_required)}>Tier {job.tier_required}+ required</span>
        </div>
      </div>

      <div className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium inline-block mb-4',
        job.status === 'open' ? 'bg-green-100 text-green-700' :
        job.status === 'active' ? 'bg-blue-100 text-blue-700' :
        job.status === 'complete' ? 'bg-stone-100 text-stone-700' :
        'bg-yellow-100 text-yellow-700'
      )}>
        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
      </div>

      <div className="bg-stone-50 rounded-lg p-4 mb-6">
        <p className="text-stone-700 whitespace-pre-wrap">{job.description}</p>
        <div className="mt-3 text-xs text-stone-500">
          Client: {shortenAddress(job.client_wallet)}
          {job.worker_wallet && ` · Worker: ${shortenAddress(job.worker_wallet)}`}
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">Milestones</h2>
        <div className="space-y-2">
          {job.milestones?.sort((a, b) => a.index - b.index).map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                m.status === 'complete' ? 'bg-green-50 border-green-200' :
                m.status === 'disputed' ? 'bg-red-50 border-red-200' :
                'bg-white border-stone-200'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                  m.status === 'complete' ? 'bg-green-200 text-green-700' :
                  'bg-stone-200 text-stone-500'
                )}>
                  {m.index + 1}
                </div>
                <span className={m.status === 'complete' ? 'line-through text-stone-500' : 'font-medium'}>
                  {m.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-emerald-700">{formatEth(m.amount_eth)}</span>
                {isClient && m.status === 'pending' && job.status === 'active' && (
                  <button
                    onClick={() => handleConfirmMilestone(m.id)}
                    disabled={actionLoading}
                    className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Apply flow */}
      {job.status === 'open' && authenticated && !isClient && !hasApplied && (
        <div className="border border-stone-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Apply for this Job</h3>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <textarea
            value={coverNote}
            onChange={e => setCoverNote(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-emerald-600 outline-none"
            rows={3}
            placeholder="Why are you a good fit for this job?"
          />
          <button
            onClick={handleApply}
            disabled={actionLoading}
            className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50"
          >
            {actionLoading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}

      {hasApplied && !isWorker && job.status === 'open' && (
        <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-emerald-700 font-medium">You&apos;ve applied! Waiting for client response.</p>
        </div>
      )}

      {/* Client: View Applications */}
      {isClient && job.status === 'open' && applications.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Applications ({applications.length})</h3>
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="border border-stone-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{shortenAddress(app.worker_wallet)}</span>
                  <button
                    onClick={() => handleAccept(app.worker_wallet)}
                    disabled={actionLoading}
                    className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800 disabled:opacity-50"
                  >
                    Accept Worker
                  </button>
                </div>
                {app.cover_note && <p className="text-sm text-stone-600">{app.cover_note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client: Fund Escrow */}
      {isClient && job.status === 'accepted' && (
        <div className="border border-stone-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Fund Escrow</h3>
          <p className="text-sm text-stone-600 mb-3">
            Worker accepted. Fund the escrow to activate this job. Total: {formatEth(job.budget_eth)} (Base Sepolia testnet ETH).
          </p>
          <button
            onClick={handleFund}
            disabled={actionLoading}
            className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50"
          >
            {actionLoading ? 'Funding...' : `Fund Escrow — ${formatEth(job.budget_eth)}`}
          </button>
        </div>
      )}

      {/* Worker info on active/complete */}
      {job.worker_wallet && job.status !== 'open' && (
        <div className="border border-stone-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Assigned Worker</h3>
          <p className="text-sm text-stone-600">{shortenAddress(job.worker_wallet)}</p>
          {job.contract_address && (
            <p className="text-xs text-stone-400 mt-1">Contract: {shortenAddress(job.contract_address)}</p>
          )}
        </div>
      )}
    </div>
  );
}
