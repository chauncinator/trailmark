'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { CATEGORIES, CategoryKey } from '@/lib/tiers';
import { db } from '@/lib/supabase';

export default function PostJobPage() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const walletAddress = wallets?.[0]?.address || '';

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '' as CategoryKey | '',
    subcategory: '',
    location: '',
    budget_eth: '',
    tier_required: '0',
    milestones: [{ name: '', amount_eth: '' }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addMilestone() {
    setForm(prev => ({
      ...prev,
      milestones: [...prev.milestones, { name: '', amount_eth: '' }],
    }));
  }

  function updateMilestone(index: number, field: 'name' | 'amount_eth', value: string) {
    setForm(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => i === index ? { ...m, [field]: value } : m),
    }));
  }

  function removeMilestone(index: number) {
    setForm(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit() {
    if (!form.title || !form.description || !form.category || !form.budget_eth) {
      setError('Fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');

    const totalMilestoneAmount = form.milestones.reduce((sum, m) => sum + parseFloat(m.amount_eth || '0'), 0);
    const budget = parseFloat(form.budget_eth);

    if (Math.abs(totalMilestoneAmount - budget) > 0.001) {
      setError(`Milestone total (${totalMilestoneAmount.toFixed(4)}) must equal budget (${budget.toFixed(4)})`);
      setLoading(false);
      return;
    }

    const { data: jobData, error: jobError } = await db
      .from('jobs')
      .insert({
        client_wallet: walletAddress,
        title: form.title,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory || null,
        location: form.location || null,
        budget_eth: budget,
        tier_required: parseInt(form.tier_required),
        status: 'open',
      })
      .select('id')
      .single();

    if (jobError) {
      setError(jobError.message);
      setLoading(false);
      return;
    }

    if (form.milestones.length > 0) {
      const milestoneInserts = form.milestones
        .filter(m => m.name && m.amount_eth)
        .map((m, i) => ({
          job_id: jobData.id,
          index: i,
          name: m.name,
          amount_eth: parseFloat(m.amount_eth),
        }));

      await db.from('milestones').insert(milestoneInserts);
    }

    setLoading(false);
    router.push(`/jobs/${jobData.id}`);
  }

  if (!authenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-600 mb-4">Connect your wallet to post a job</p>
        <button onClick={login} className="px-6 py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Post a Job</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Job Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            placeholder="e.g. Electrical panel upgrade — Near Southside duplex"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description *</label>
          <textarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            rows={4}
            placeholder="Describe the work needed..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Category *</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value as CategoryKey, subcategory: '' }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            >
              <option value="">Select...</option>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Subcategory</label>
            <select
              value={form.subcategory}
              onChange={e => setForm(prev => ({ ...prev, subcategory: e.target.value }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
              disabled={!form.category}
            >
              <option value="">Select...</option>
              {form.category && CATEGORIES[form.category].subcategories.map(sub => (
                <option key={sub} value={sub}>{sub.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="Fort Worth neighborhood"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Total Budget (ETH) *</label>
            <input
              type="number"
              step="0.001"
              value={form.budget_eth}
              onChange={e => setForm(prev => ({ ...prev, budget_eth: e.target.value }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="0.08"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Minimum Tier Required</label>
          <select
            value={form.tier_required}
            onChange={e => setForm(prev => ({ ...prev, tier_required: e.target.value }))}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
          >
            <option value="0">Tier 0 — Open (anyone)</option>
            <option value="1">Tier 1 — Peer Verified</option>
            <option value="2">Tier 2 — Credentialed</option>
            <option value="3">Tier 3 — Established</option>
          </select>
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-stone-700">Milestones</label>
            <button onClick={addMilestone} className="text-sm text-emerald-700 hover:underline">
              + Add milestone
            </button>
          </div>
          {form.milestones.map((m, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={m.name}
                onChange={e => updateMilestone(i, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                placeholder={`Milestone ${i + 1} name`}
              />
              <input
                type="number"
                step="0.001"
                value={m.amount_eth}
                onChange={e => updateMilestone(i, 'amount_eth', e.target.value)}
                className="w-28 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                placeholder="ETH"
              />
              {form.milestones.length > 1 && (
                <button onClick={() => removeMilestone(i)} className="text-red-500 hover:text-red-700 px-2">
                  x
                </button>
              )}
            </div>
          ))}
          <div className="text-xs text-stone-500 mt-1">
            Milestone total: {form.milestones.reduce((s, m) => s + parseFloat(m.amount_eth || '0'), 0).toFixed(4)} ETH
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </div>
    </div>
  );
}
