import { getJobs } from '@/app/_actions/job-actions';
import { getTierBadgeClasses, CATEGORIES, CategoryKey } from '@/lib/tiers';
import { formatEth, cn } from '@/lib/utils';
import Link from 'next/link';

const categoryColors: Record<string, string> = {
  trades_licensed: 'bg-orange-100 text-orange-700',
  trades_unlicensed: 'bg-yellow-100 text-yellow-700',
  digital: 'bg-blue-100 text-blue-700',
  services: 'bg-purple-100 text-purple-700',
  civic: 'bg-teal-100 text-teal-700',
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tier?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category;

  const filters = {
    category: activeCategory,
    tier: params.tier ? parseInt(params.tier) : undefined,
    status: 'open' as const,
  };

  const res = await getJobs(filters);
  const jobs = res.success ? res.data : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Job Marketplace</h1>
          <p className="text-stone-500 mt-1 text-sm">{jobs.length} open job{jobs.length !== 1 ? 's' : ''} in Fort Worth</p>
        </div>
        <Link
          href="/jobs/post"
          className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          Post a Job
        </Link>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/jobs"
          className={cn(
            'px-3 py-1.5 rounded-full text-sm border transition-colors',
            !activeCategory
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-stone-200 text-stone-600 hover:border-stone-300'
          )}
        >
          All
        </Link>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <Link
            key={key}
            href={`/jobs?category=${key}`}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm border transition-colors',
              activeCategory === key
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-stone-200 text-stone-600 hover:border-stone-300'
            )}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Job listings */}
      {jobs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-stone-400 text-4xl mb-3">📋</div>
          <p className="text-stone-500 mb-4">No open jobs match your filters.</p>
          <Link href="/jobs" className="text-sm text-emerald-700 hover:underline">Clear filters</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: {
            id: string;
            title: string;
            description: string;
            category: string;
            subcategory: string | null;
            budget_eth: number;
            tier_required: number;
            location: string | null;
            status: string;
            client_wallet: string;
            milestones: { name: string; amount_eth: number; status: string }[];
          }) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block border border-stone-200 rounded-xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 mb-1">{job.title}</h3>
                  <p className="text-sm text-stone-500 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      categoryColors[job.category] || 'bg-stone-100 text-stone-600'
                    )}>
                      {(job.category as string).replace(/_/g, ' ')}
                    </span>
                    {job.subcategory && (
                      <span className="text-xs text-stone-400">{job.subcategory.replace(/_/g, ' ')}</span>
                    )}
                    {job.location && (
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {job.location}
                      </span>
                    )}
                    <span className={getTierBadgeClasses(job.tier_required)}>
                      Tier {job.tier_required}+
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-emerald-700">
                    {formatEth(job.budget_eth)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    {job.milestones?.length || 0} milestone{(job.milestones?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
