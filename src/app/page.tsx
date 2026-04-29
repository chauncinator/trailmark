import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center py-16">
      <div className="h-16 w-16 rounded-2xl bg-emerald-700 flex items-center justify-center mb-6">
        <span className="text-white font-bold text-2xl">T</span>
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-stone-900 mb-4">
        Trailmark Guild
      </h1>
      <p className="text-lg text-stone-600 max-w-2xl mb-8">
        Fort Worth&apos;s decentralized labor marketplace. On-chain reputation you own,
        bond coverage for jobs, and AI agents that surface opportunities you&apos;d otherwise miss.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mb-12">
        <div className="border border-stone-200 rounded-lg p-5 text-left">
          <div className="text-emerald-700 font-semibold mb-1">Own Your Reputation</div>
          <p className="text-sm text-stone-600">On-chain credentials and scores that follow you, not the platform.</p>
        </div>
        <div className="border border-stone-200 rounded-lg p-5 text-left">
          <div className="text-emerald-700 font-semibold mb-1">Bond Coverage</div>
          <p className="text-sm text-stone-600">DAO-backed bond pool covers workers — no personal collateral needed.</p>
        </div>
        <div className="border border-stone-200 rounded-lg p-5 text-left">
          <div className="text-emerald-700 font-semibold mb-1">AI Agents</div>
          <p className="text-sm text-stone-600">Scout finds city RFPs, Trailblazer guides onboarding, Pathfinder plans your career.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/onboarding"
          className="px-6 py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/jobs"
          className="px-6 py-3 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors"
        >
          Browse Jobs
        </Link>
      </div>
    </div>
  );
}
