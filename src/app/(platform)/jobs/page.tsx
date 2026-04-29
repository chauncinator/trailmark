import { getJobs } from '@/app/_actions/job-actions';
import { getTierBadgeClasses, CATEGORIES, CategoryKey } from '@/lib/tiers';
import { formatEth } from '@/lib/utils';
import Link from 'next/link';

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tier?: string }>;
}) {
  const params = await searchParams;
  const filters = {
    category: params.category,
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
          <p className="text-stone-600 mt-1">Browse open jobs in Fort Worth</p>
        </div>
        <Link
          href="/jobs/post"
          className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800"
        >
          Post a Job
        </Link>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/jobs"
          className="px-3 py-1.5 rounded-full text-sm border border-stone-200 hover:border-stone-300 transition-colors"
        >
          All
        </Link>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <Link
            key={key}
            href={`/jobs?category=${key}`}
            className="px-3 py-1.5 rounded-full text-sm border border-stone-200 hover:border-stone-300 transition-colors"
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Job listings */}
      {jobs.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          No open jobs found. Be the first to post one!
        </div>
      ) : (
        <div className="space-y-4">
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
            milestones: { name: string; amount_eth: number; status: string }[];
          }) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block border border-stone-200 rounded-lg p-5 hover:border-stone-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-900">{job.title}</h3>
                  <p className="text-sm text-stone-600 mt-1 line-clamp-2">{job.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {(job.category as string).replace(/_/g, ' ')}
                    </span>
                    {job.location && (
                      <span className="text-xs text-stone-500">{job.location}</span>
                    )}
                    <span className={getTierBadgeClasses(job.tier_required)}>
                      Tier {job.tier_required}+
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-semibold text-emerald-700">
                    {formatEth(job.budget_eth)}
                  </div>
                  <div className="text-xs text-stone-500">
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
