'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { analyzeRFP } from '@/app/_actions/scout-actions';

export default function ScoutPage() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets?.[0]?.address || '';

  const [rfpText, setRfpText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!rfpText.trim()) return;
    setLoading(true);
    setAnalysis('');
    const res = await analyzeRFP(rfpText, authenticated ? walletAddress : undefined);
    setAnalysis(res.content);
    setLoading(false);
  }

  const sampleRFPs = [
    {
      label: 'Fort Worth IT Services RFP',
      text: `CITY OF FORT WORTH, TEXAS
REQUEST FOR PROPOSAL (RFP)
RFP Number: 2026-IT-0042

Title: Network Infrastructure Upgrade — Municipal Buildings

Description: The City of Fort Worth is seeking qualified contractors to upgrade network infrastructure across 12 municipal buildings including City Hall, the Public Safety Building, and various community centers.

Scope: Installation of Cat6A cabling, new switches, access points, and fiber backbone connections between buildings. Includes removal and disposal of legacy equipment.

Budget Range: $450,000 - $600,000

Timeline: Proposal due June 15, 2026. Work to begin August 1, 2026. Completion by December 31, 2026.

M/WBE Requirements: 30% M/WBE subcontracting participation required. This equals approximately $135,000-$180,000 in subcontracting opportunities.

Required Qualifications:
- Licensed electrical contractor (TDLR)
- Minimum 5 years commercial network cabling experience
- Bond capacity of $600,000+
- City of Fort Worth vendor registration

Pre-bid Meeting: May 20, 2026, 10:00 AM, City Hall Room 301

Contact: procurement@fortworthtexas.gov`,
    },
    {
      label: 'Bonfire Landscaping RFP',
      text: `FORT WORTH INDEPENDENT SCHOOL DISTRICT
INVITATION FOR BID
IFB #FWISD-2026-GND-08

Title: Grounds Maintenance Services — 15 School Sites

Description: FWISD seeks qualified landscaping contractors to provide ongoing grounds maintenance services for 15 school sites across the district.

Services Include:
- Weekly mowing, edging, and blowing
- Monthly shrub and hedge trimming
- Quarterly fertilization program
- Seasonal flower bed maintenance
- Irrigation system monitoring and minor repairs

Budget: $180,000 annually (3-year contract with 2 renewal options)

M/WBE Goal: 20% subcontracting ($36,000 annually)

Requirements:
- Texas licensed irrigator on staff (for irrigation work)
- $1M general liability insurance
- 3 references from similar institutional clients
- Background checks for all on-site personnel

Bid Deadline: June 1, 2026

Questions to: procurement@fwisd.org`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Scout Agent</h1>
        <p className="text-stone-600 mt-1">Paste an RFP or procurement document to get a plain-language breakdown with eligibility check</p>
      </div>

      {/* Sample RFP buttons */}
      <div className="mb-4">
        <p className="text-xs text-stone-500 mb-2">Try a sample:</p>
        <div className="flex gap-2">
          {sampleRFPs.map((sample, i) => (
            <button
              key={i}
              onClick={() => setRfpText(sample.text)}
              className="px-3 py-1.5 rounded-full text-xs border border-stone-200 text-stone-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* RFP Input */}
      <div className="mb-4">
        <textarea
          value={rfpText}
          onChange={e => setRfpText(e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none text-sm"
          rows={8}
          placeholder="Paste RFP text here..."
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !rfpText.trim()}
        className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Analyzing...' : 'Analyze RFP'}
      </button>

      {!authenticated && (
        <p className="text-xs text-stone-500 mt-2 text-center">
          <button onClick={login} className="text-emerald-700 hover:underline">Connect wallet</button> for personalized eligibility check
        </p>
      )}

      {/* Analysis Result */}
      {analysis && (
        <div className="mt-6 border border-stone-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">S</div>
            <span className="font-medium text-sm">Scout Analysis</span>
          </div>
          <div className="prose prose-sm prose-stone max-w-none whitespace-pre-wrap">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
