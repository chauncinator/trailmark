import { db } from '@/lib/supabase';
import { getTierBadgeClasses, TIER_REQUIREMENTS, CATEGORIES, CategoryKey } from '@/lib/tiers';
import { shortenAddress, formatEth } from '@/lib/utils';
import { VouchSection } from '@/shared/components/vouch-section';
import Link from 'next/link';

interface Attestation {
  credential_type: string;
  category: string | null;
  subcategory: string | null;
  external_ref: string | null;
  issued_at: string;
  expires_at: string | null;
  attester_wallet: string;
}

interface WorkerJob {
  title: string;
  status: string;
  budget_eth: number;
  created_at: string;
}

interface Worker {
  wallet_address: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  category: string | null;
  subcategory: string | null;
  tier: number;
  completion_rate: number;
  quality_score: number;
  peer_weight: number;
  jury_score: number;
  mentor_score: number;
  dao_score: number;
  tdlr_verified: boolean;
  tdlr_license_number: string | null;
  created_at: string;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const params = await searchParams;
  const address = params.address;

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-2xl font-bold text-stone-900 mb-2 text-center">Worker Profiles</h1>
        <p className="text-stone-600 mb-6 text-center text-sm">Enter a wallet address or click a demo worker below.</p>
        <ProfileSearch />
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">Demo Workers</h2>
          <div className="space-y-2">
            {[
              { address: '0x1234567890abcdef1234567890abcdef12345678', name: 'Marcus Johnson', tier: 2, cat: 'Electrical' },
              { address: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Sarah Chen', tier: 1, cat: 'Web Dev' },
              { address: '0x9876543210fedcba9876543210fedcba98765432', name: 'David Rivera', tier: 0, cat: 'Landscaping' },
              { address: '0x1111222233334444555566667777888899990000', name: 'Keisha Williams', tier: 1, cat: 'Tutoring' },
              { address: '0xaaaabbbbccccddddeeeeffff0000111122223333', name: 'Tommy Barker', tier: 1, cat: 'Painting' },
            ].map(w => (
              <Link
                key={w.address}
                href={`/profile?address=${w.address}`}
                className="flex items-center justify-between p-3 border border-stone-200 rounded-lg hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                    {w.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{w.name}</div>
                    <div className="text-xs text-stone-500">{w.cat}</div>
                  </div>
                </div>
                <span className={getTierBadgeClasses(w.tier)}>T{w.tier}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { data: worker } = await db
    .from('workers')
    .select('*')
    .eq('wallet_address', address)
    .single() as { data: Worker | null };

  if (!worker) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-stone-500 mb-4">No worker found for {shortenAddress(address)}</p>
        <ProfileSearch />
      </div>
    );
  }

  const { data: attestations } = await db
    .from('attestations')
    .select('*')
    .eq('worker_wallet', address)
    .order('issued_at', { ascending: false }) as { data: Attestation[] | null };

  const { data: jobs } = await db
    .from('jobs')
    .select('title, status, budget_eth, created_at')
    .eq('worker_wallet', address)
    .order('created_at', { ascending: false })
    .limit(10) as { data: WorkerJob[] | null };

  const tierInfo = TIER_REQUIREMENTS[worker.tier] || TIER_REQUIREMENTS[0];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
          {worker.name?.[0] || '?'}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-stone-900">{worker.name || 'Unnamed Worker'}</h1>
          <p className="text-stone-500 text-sm">{shortenAddress(worker.wallet_address)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={getTierBadgeClasses(worker.tier)}>
              Tier {worker.tier}: {tierInfo.name}
            </span>
            {worker.location && (
              <span className="text-xs text-stone-500">{worker.location}</span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {worker.bio && (
        <div className="mb-6">
          <p className="text-stone-700">{worker.bio}</p>
        </div>
      )}

      {/* Category */}
      {worker.category && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-stone-500">Category:</span>
          <span className="text-sm font-medium">{CATEGORIES[worker.category as CategoryKey]?.label || worker.category}</span>
          {worker.subcategory && (
            <span className="text-sm text-stone-400">— {worker.subcategory.replace(/_/g, ' ')}</span>
          )}
        </div>
      )}

      {/* Reputation Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-stone-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-stone-900">{worker.completion_rate}%</div>
          <div className="text-xs text-stone-500">Completion Rate</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-stone-900">{worker.quality_score}</div>
          <div className="text-xs text-stone-500">Quality Score</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-stone-900">{worker.peer_weight}</div>
          <div className="text-xs text-stone-500">Peer Weight</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{worker.tier}</div>
          <div className="text-xs text-stone-500">Current Tier</div>
        </div>
      </div>

      {/* Tier Roadmap */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Tier Roadmap</h2>
        <div className="space-y-2">
          {TIER_REQUIREMENTS.map((tier) => (
            <div
              key={tier.tier}
              className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                tier.tier === worker.tier
                  ? 'bg-emerald-50 border border-emerald-200'
                  : tier.tier < worker.tier
                    ? 'bg-green-50 border border-green-100'
                    : 'bg-stone-50'
              }`}
            >
              <span className={getTierBadgeClasses(tier.tier)}>T{tier.tier}</span>
              <div className="flex-1">
                <div className="font-medium">{tier.name}</div>
                <div className="text-xs text-stone-500">
                  {tier.tier === worker.tier ? 'Current tier' : `${tier.jobs} jobs, score ${tier.qualityScore}+`}
                  {' · '}{tier.jobAccess}
                  {' · '}{tier.bondCoverage}
                </div>
              </div>
              {tier.tier < worker.tier && (
                <span className="text-green-600 text-xs">Completed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Credentials / Attestations */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Credentials</h2>
        {attestations && attestations.length > 0 ? (
          <div className="space-y-2">
            {attestations.map((att, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{att.credential_type.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-stone-500">
                    {att.category?.replace(/_/g, ' ')}
                    {att.subcategory && ` — ${att.subcategory.replace(/_/g, ' ')}`}
                    {att.external_ref && ` · Ref: ${att.external_ref}`}
                  </div>
                </div>
                <div className="text-xs text-stone-400">
                  {new Date(att.issued_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 text-sm">No credentials yet</p>
        )}
      </div>

      {/* Job History */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Job History</h2>
        {jobs && jobs.length > 0 ? (
          <div className="space-y-2">
            {jobs.map((job, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{job.title}</div>
                  <div className="text-xs text-stone-500">{new Date(job.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatEth(job.budget_eth)}</div>
                  <div className="text-xs text-stone-500 capitalize">{job.status}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 text-sm">No jobs completed yet</p>
        )}
      </div>

      {/* License */}
      {worker.tdlr_verified && worker.tdlr_license_number && (
        <div className="mb-8 p-4 border border-green-200 bg-green-50 rounded-lg">
          <div className="text-sm font-medium text-green-700">TDLR License Verified</div>
          <div className="text-xs text-green-600">{worker.tdlr_license_number}</div>
        </div>
      )}

      {/* Vouch for this worker */}
      <VouchSection workerWallet={worker.wallet_address} workerCategory={worker.category} />
    </div>
  );
}

function ProfileSearch() {
  return (
    <form action="/profile" method="get" className="flex gap-2 max-w-md mx-auto">
      <input
        type="text"
        name="address"
        placeholder="Wallet address (0x...)"
        className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800"
      >
        Look Up
      </button>
    </form>
  );
}
