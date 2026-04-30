import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <div className="text-center py-16 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Fort Worth, Texas — Live on Base
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-stone-900 mb-4">
          Your work. Your reputation.<br />Your terms.
        </h1>
        <p className="text-lg text-stone-600 mb-8 leading-relaxed">
          Medieval guilds solved peer verification and fair access — then got captured by incumbents.
          Modern gig platforms replicate that capture. <strong className="text-stone-900">Trailmark rebuilds the original promise</strong>,
          enforced by code, owned by workers.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors"
          >
            Join the Guild
          </Link>
          <Link
            href="/jobs"
            className="px-6 py-3 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      </div>

      {/* The Problem */}
      <div className="w-full max-w-4xl border-t border-stone-200 py-16">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-6 text-center">The Problem</h2>
        <blockquote className="text-xl text-stone-700 text-center italic max-w-2xl mx-auto leading-relaxed">
          &ldquo;I run a handyman business in Fort Worth. I can do the work.
          I can&apos;t get the commercial contracts — not because of skill,
          but because of connections I don&apos;t have and bonds I can&apos;t afford.&rdquo;
        </blockquote>
      </div>

      {/* Two Layers */}
      <div className="w-full max-w-4xl pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-stone-200 rounded-xl p-6">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Open Infrastructure</div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">Trailmark Protocol</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Credential schemas, reputation graph, escrow interface, tier definitions, agentic interface spec.
              Permissionless. Any city can build on it.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {['EAS Attestations', 'Base L2', 'Solidity Escrow', 'MCP Tools'].map(t => (
                <span key={t} className="px-2 py-1 rounded text-xs bg-stone-100 text-stone-600">{t}</span>
              ))}
            </div>
          </div>
          <div className="border border-emerald-200 rounded-xl p-6 bg-emerald-50/50">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Fort Worth Application</div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">Trailmark Guild</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Job marketplace, DAO treasury, AI agents, TDLR verification, bond coverage.
              The first guild built on the Protocol — serving Fort Worth workers.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {['Job Marketplace', 'AI Agents', 'TDLR Verify', 'DAO Treasury'].map(t => (
                <span key={t} className="px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-700">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="w-full max-w-4xl border-t border-stone-200 py-16">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Connect', desc: 'Wallet onboarding — no MetaMask needed. Privy handles it.' },
            { step: '2', title: 'Verify', desc: 'TDLR license check, category matching, tier assignment.' },
            { step: '3', title: 'Work', desc: 'Browse jobs, apply, milestones with escrow, auto-release on completion.' },
            { step: '4', title: 'Level Up', desc: 'Peer attestations, reputation scores, tier advancement, bond coverage grows.' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="h-10 w-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold mx-auto mb-3">
                {s.step}
              </div>
              <div className="font-semibold text-stone-900 mb-1">{s.title}</div>
              <p className="text-xs text-stone-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tier System */}
      <div className="w-full max-w-4xl border-t border-stone-200 py-16">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-8 text-center">Tier System</h2>
        <div className="space-y-3">
          {[
            { tier: 0, name: 'Open', color: 'bg-gray-100 text-gray-700', access: 'Under $500', bond: 'None', req: 'Wallet + ID verification' },
            { tier: 1, name: 'Peer Verified', color: 'bg-blue-100 text-blue-700', access: 'Up to $2,500', bond: '$2,500 DAO coverage', req: '5 jobs, 2 peer attestations' },
            { tier: 2, name: 'Credentialed', color: 'bg-green-100 text-green-700', access: 'Up to $25,000', bond: '$25,000 DAO coverage', req: 'License, 10 jobs, 4.0+ score' },
            { tier: 3, name: 'Established', color: 'bg-amber-100 text-amber-700', access: 'Above $25K, city RFPs', bond: 'Full coverage', req: '25 jobs, 4.5+ score, mentorship' },
            { tier: 4, name: 'Guild Master', color: 'bg-purple-100 text-purple-700', access: 'GC functions', bond: 'Pooled bond', req: 'Multi-category, PM track, DAO vote' },
          ].map(t => (
            <div key={t.tier} className="flex items-center gap-4 p-3 border border-stone-200 rounded-lg">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.color}`}>
                T{t.tier}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-stone-900">{t.name}</div>
                <div className="text-xs text-stone-500">{t.req}</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-stone-700">{t.access}</div>
                <div className="text-xs text-stone-400">{t.bond}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Agents */}
      <div className="w-full max-w-4xl border-t border-stone-200 py-16">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-8 text-center">AI Agents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: 'Trailblazer', role: 'Onboarding', desc: 'Guides new workers through registration, category detection, TDLR verification, and tier roadmap.', color: 'emerald' },
            { name: 'Scout', role: 'Bid Intelligence', desc: 'Translates city RFPs into plain language, checks eligibility, flags M/WBE requirements with dollar amounts.', color: 'blue' },
            { name: 'Pathfinder', role: 'Career Pathway', desc: 'Exact tier gap analysis — not generic advice. "You need 3 more jobs and 1 peer attestation."', color: 'amber' },
          ].map(a => (
            <div key={a.name} className="border border-stone-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  a.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  a.color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {a.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{a.name}</div>
                  <div className="text-xs text-stone-400">{a.role}</div>
                </div>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Ask */}
      <div className="w-full max-w-4xl border-t border-stone-200 py-16 text-center">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">The Ask</h2>
        <p className="text-stone-700 max-w-xl mx-auto leading-relaxed mb-8">
          15 founding workers. DAO seed treasury. City sub-threshold pilot.
          TCC training partnership. From Fort Worth to 500 workers to other cities.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors"
          >
            Start the Demo
          </Link>
          <Link
            href="/profile?address=0x1234567890abcdef1234567890abcdef12345678"
            className="px-6 py-3 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors"
          >
            View Demo Worker
          </Link>
        </div>
      </div>
    </div>
  );
}
