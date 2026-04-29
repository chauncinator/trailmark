'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { upsertWorker, getWorker } from '@/app/_actions/worker-actions';
import { CATEGORIES, CategoryKey, getTierBadgeClasses, TIER_REQUIREMENTS } from '@/lib/tiers';
import { cn, shortenAddress } from '@/lib/utils';
import { chatWithTrailblazer } from '@/app/_actions/agent-actions';

type Step = 'connect' | 'profile' | 'category' | 'license' | 'tier' | 'chat';

interface WorkerProfile {
  name: string;
  bio: string;
  location: string;
  category: CategoryKey | '';
  subcategory: string;
  tdlrLicenseNumber: string;
  tdlrVerified: boolean;
  tier: number;
}

const initialState: WorkerProfile = {
  name: '',
  bio: '',
  location: '',
  category: '',
  subcategory: '',
  tdlrLicenseNumber: '',
  tdlrVerified: false,
  tier: 0,
};

export default function OnboardingPage() {
  const { login, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const [step, setStep] = useState<Step>('connect');
  const [form, setForm] = useState<WorkerProfile>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const walletAddress = wallets?.[0]?.address || user?.wallet?.address || '';

  useEffect(() => {
    if (authenticated && walletAddress) {
      getWorker(walletAddress).then((res) => {
        if (res.success && res.data) {
          setForm({
            name: res.data.name || '',
            bio: res.data.bio || '',
            location: res.data.location || '',
            category: res.data.category || '',
            subcategory: res.data.subcategory || '',
            tdlrLicenseNumber: res.data.tdlr_license_number || '',
            tdlrVerified: res.data.tdlr_verified || false,
            tier: res.data.tier || 0,
          });
          if (!res.data.name) setStep('profile');
          else if (!res.data.category) setStep('category');
          else setStep('tier');
        } else {
          setStep('profile');
        }
      });
    }
  }, [authenticated, walletAddress]);

  const handleProfileSubmit = async () => {
    if (!form.name || !form.location) {
      setError('Name and location are required');
      return;
    }
    setLoading(true);
    setError('');
    const res = await upsertWorker(walletAddress, {
      name: form.name,
      bio: form.bio,
      location: form.location,
    });
    setLoading(false);
    if (res.success) setStep('category');
    else setError(res.error);
  };

  const handleCategorySubmit = async () => {
    if (!form.category || !form.subcategory) {
      setError('Please select a category and subcategory');
      return;
    }
    setLoading(true);
    setError('');
    const cat = CATEGORIES[form.category as CategoryKey];
    if (cat?.requiresLicense) {
      setStep('license');
      setLoading(false);
      return;
    }
    const res = await upsertWorker(walletAddress, {
      category: form.category,
      subcategory: form.subcategory,
      tier: 0,
    });
    setLoading(false);
    if (res.success) setStep('tier');
    else setError(res.error);
  };

  const handleLicenseSubmit = async () => {
    setLoading(true);
    setError('');
    const res = await upsertWorker(walletAddress, {
      category: form.category,
      subcategory: form.subcategory,
      tdlr_license_number: form.tdlrLicenseNumber,
      tdlr_verified: true,
      tier: 0,
    });
    setLoading(false);
    if (res.success) {
      setForm(prev => ({ ...prev, tdlrVerified: true }));
      setStep('tier');
    } else setError(res.error);
  };

  const skipLicense = async () => {
    setLoading(true);
    const res = await upsertWorker(walletAddress, {
      category: form.category,
      subcategory: form.subcategory,
      tier: 0,
    });
    setLoading(false);
    if (res.success) setStep('tier');
    else setError(res.error);
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Join Trailmark Guild</h1>
        <p className="text-stone-600 mt-1">Get on-boarded to Fort Worth&apos;s decentralized labor marketplace</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {['connect', 'profile', 'category', 'license', 'tier'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'h-2 rounded-full transition-all',
              step === s || (s === 'license' && !CATEGORIES[form.category as CategoryKey]?.requiresLicense && step !== 'connect' && step !== 'profile' && step !== 'category')
                ? 'bg-emerald-700 w-8'
                : ['connect', 'profile', 'category', 'tier'].indexOf(step) > ['connect', 'profile', 'category', 'tier'].indexOf(s)
                  ? 'bg-emerald-700 w-8'
                  : 'bg-stone-200 w-8'
            )} />
            {i < 4 && <div className="w-4" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Step: Connect Wallet */}
      {step === 'connect' && !authenticated && (
        <div className="border border-stone-200 rounded-lg p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-700 text-xl">W</span>
          </div>
          <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-stone-600 mb-6 text-sm">Start by connecting a wallet — this is your identity on Trailmark. No MetaMask required.</p>
          <button
            onClick={login}
            className="px-6 py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Step: Profile */}
      {step === 'profile' && authenticated && (
        <div className="border border-stone-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-1">Tell us about yourself</h2>
          <p className="text-sm text-stone-600 mb-4">Connected: {shortenAddress(walletAddress)}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Location *</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                placeholder="Fort Worth neighborhood or ZIP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                rows={3}
                placeholder="Describe your work experience..."
              />
            </div>
            <button
              onClick={handleProfileSubmit}
              disabled={loading}
              className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Category Selection */}
      {step === 'category' && (
        <div className="border border-stone-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-1">What kind of work do you do?</h2>
          <p className="text-sm text-stone-600 mb-4">Select the category that best describes your skills</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setForm(prev => ({ ...prev, category: key as CategoryKey, subcategory: '' }))}
                className={cn(
                  'border rounded-lg p-4 text-left transition-colors',
                  form.category === key
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-stone-200 hover:border-stone-300'
                )}
              >
                <div className="font-medium text-sm">{cat.label}</div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {cat.requiresLicense ? 'License required' : 'No license needed'}
                </div>
              </button>
            ))}
          </div>

          {form.category && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">Specialization</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES[form.category as CategoryKey].subcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setForm(prev => ({ ...prev, subcategory: sub }))}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm border transition-colors',
                      form.subcategory === sub
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    )}
                  >
                    {sub.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCategorySubmit}
            disabled={loading || !form.category || !form.subcategory}
            className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      )}

      {/* Step: License Verification */}
      {step === 'license' && (
        <div className="border border-stone-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-1">TDLR License Verification</h2>
          <p className="text-sm text-stone-600 mb-4">
            Your selected category ({CATEGORIES[form.category as CategoryKey]?.label}) requires a Texas license.
            Enter your TDLR license number to verify.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">TDLR License Number</label>
              <input
                type="text"
                value={form.tdlrLicenseNumber}
                onChange={e => setForm(prev => ({ ...prev, tdlrLicenseNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                placeholder="e.g. TDLR-28012"
              />
            </div>
            <button
              onClick={handleLicenseSubmit}
              disabled={loading || !form.tdlrLicenseNumber}
              className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify License'}
            </button>
            <button
              onClick={skipLicense}
              disabled={loading}
              className="w-full py-2.5 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Step: Tier Assignment */}
      {step === 'tier' && (
        <div className="border border-stone-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">You&apos;re In!</h2>

          <div className="flex items-center gap-3 mb-6">
            <span className={getTierBadgeClasses(form.tier)}>
              Tier {form.tier}: {TIER_REQUIREMENTS[form.tier].name}
            </span>
          </div>

          <div className="bg-stone-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-sm mb-3">Your Profile Summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Name</dt>
                <dd className="font-medium">{form.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Location</dt>
                <dd className="font-medium">{form.location}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Category</dt>
                <dd className="font-medium">{CATEGORIES[form.category as CategoryKey]?.label} — {form.subcategory?.replace(/_/g, ' ')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">License</dt>
                <dd className="font-medium">{form.tdlrVerified ? 'Verified' : 'Not provided'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Tier</dt>
                <dd className="font-medium">{form.tier} — {TIER_REQUIREMENTS[form.tier].name}</dd>
              </div>
            </dl>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-sm mb-3">Tier Roadmap</h3>
            <div className="space-y-2">
              {TIER_REQUIREMENTS.slice(form.tier, form.tier + 3).map((tier) => (
                <div
                  key={tier.tier}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg text-sm',
                    tier.tier === form.tier ? 'bg-emerald-50 border border-emerald-200' : 'bg-stone-50'
                  )}
                >
                  <span className={getTierBadgeClasses(tier.tier)}>
                    T{tier.tier}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{tier.name}</div>
                    <div className="text-stone-500 text-xs">
                      {tier.tier === form.tier ? 'Current tier' : `${tier.jobs} jobs, score ${tier.qualityScore}+`}
                      {' · '}{tier.jobAccess}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('chat')}
              className="flex-1 py-2.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors"
            >
              Chat with Trailblazer
            </button>
            <button
              onClick={() => router.push('/jobs')}
              className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      )}

      {/* Step: Chat with Trailblazer */}
      {step === 'chat' && <TrailblazerChat walletAddress={walletAddress} profile={form} />}
    </div>
  );
}

function TrailblazerChat({ walletAddress, profile }: { walletAddress: string; profile: WorkerProfile }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && walletAddress) {
      const openingMessage = {
        role: 'assistant' as const,
        content: `Welcome to Trailmark Guild! I'm the Trailblazer, your onboarding guide.\n\nI see you've set up your profile as a ${profile.subcategory?.replace(/_/g, ' ')} worker in ${profile.location}. That's great!\n\nWhat would you like to know? I can help you understand your tier roadmap, find vouching candidates, or explain how to level up.`,
      };
      setMessages([openingMessage]);
      setInitialized(true);
    }
  }, [initialized, walletAddress, profile]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user' as const, content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const res = await chatWithTrailblazer(newMessages);

    setLoading(false);
    if (res.success) {
      setMessages(prev => [...prev, { role: 'assistant', content: res.content }]);
    }
  };

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden flex flex-col" style={{ height: '500px' }}>
      <div className="bg-emerald-700 text-white px-4 py-3 flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold">T</div>
        <span className="font-medium text-sm">Trailblazer — Onboarding Agent</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
              msg.role === 'assistant'
                ? 'bg-stone-100 text-stone-900'
                : 'bg-emerald-700 text-white ml-auto'
            )}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-stone-100 rounded-lg px-3 py-2 text-sm text-stone-500 max-w-[80%]">
            <span className="animate-pulse">Thinking...</span>
          </div>
        )}
      </div>

      <div className="border-t border-stone-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your tier roadmap, vouching candidates..."
          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
