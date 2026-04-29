'use server';

import { chatCompletion } from '@/lib/agents/client';
import { db } from '@/lib/supabase';
import { TIER_REQUIREMENTS, CATEGORIES, CategoryKey } from '@/lib/tiers';

const PATHFINDER_SYSTEM = `You are the Pathfinder, the career pathway agent for Trailmark Guild in Fort Worth, Texas.

Your job is to give workers a specific, personalized roadmap to their next tier based on their actual profile. You are read-only — you never write data.

WHEN GIVEN A WORKER PROFILE:
1. State their current tier and the exact gap to the next tier in specific numbers
   - BAD: "Keep completing jobs and getting attestations"
   - GOOD: "You need 3 more verified jobs (currently 7, need 10) and 1 more peer attestation from a Tier 2 member in your category (currently have 2, need 3)"
2. List any active jobs in the marketplace that match their category and tier
3. Identify under-supplied categories in the Fort Worth network where their existing skills would transfer
4. If they are Tier 0 or 1: suggest specific actions to reach Tier 2

YOUR TONE:
- Precise and data-driven
- No empty encouragement — just facts and next steps
- Acknowledge constraints honestly: "The peer attestation requirement is the binding constraint right now. Your job count is fine."`;

export async function getPathfinderAdvice(workerWallet: string) {
  const { data: worker } = await db
    .from('workers')
    .select('*')
    .eq('wallet_address', workerWallet)
    .single();

  if (!worker) {
    return { success: false, content: 'Worker profile not found. Complete onboarding first.' };
  }

  const { data: attestations } = await db
    .from('attestations')
    .select('*')
    .eq('worker_wallet', workerWallet);

  const { data: jobs } = await db
    .from('jobs')
    .select('title, budget_eth, tier_required, category, status')
    .eq('status', 'open')
    .eq('category', worker.category || '')
    .limit(5);

  const { data: matchingJobs } = await db
    .from('jobs')
    .select('title, budget_eth, tier_required, category')
    .gte('tier_required', 0)
    .lte('tier_required', worker.tier)
    .eq('status', 'open')
    .limit(5);

  const currentTier = TIER_REQUIREMENTS[worker.tier];
  const nextTier = TIER_REQUIREMENTS[Math.min(worker.tier + 1, 4)];

  const profileSummary = `Worker Profile:
- Name: ${worker.name}
- Current Tier: ${worker.tier} (${currentTier.name})
- Category: ${worker.category ? CATEGORIES[worker.category as CategoryKey]?.label : 'Not set'} — ${worker.subcategory || 'N/A'}
- Location: ${worker.location || 'Not set'}
- Quality Score: ${worker.quality_score}/500
- Completion Rate: ${worker.completion_rate}%
- Peer Weight: ${worker.peer_weight}
- Licensed: ${worker.tdlr_verified ? 'Yes' : 'No'}

Credentials: ${attestations?.length || 0} attestations
${attestations?.map(a => `- ${a.credential_type}: ${a.category || 'N/A'}`).join('\n') || 'None'}

Next Tier Requirements (${nextTier.name}):
- Jobs: ${nextTier.jobs}
- Quality Score: ${nextTier.qualityScore}+
- License Required: ${nextTier.licenseRequired ? 'Yes' : 'No'}
- Job Access: ${nextTier.jobAccess}
- Bond Coverage: ${nextTier.bondCoverage}

Open Jobs Matching Their Category: ${jobs?.length || 0}
${jobs?.map(j => `- ${j.title} (${j.budget_eth} ETH, Tier ${j.tier_required}+)`).join('\n') || 'None'}

Open Jobs Within Their Tier: ${matchingJobs?.length || 0}
${matchingJobs?.map(j => `- ${j.title} (${j.budget_eth} ETH, Tier ${j.tier_required}+)`).join('\n') || 'None'}`;

  try {
    const response = await chatCompletion([
      { role: 'system', content: PATHFINDER_SYSTEM },
      { role: 'user', content: profileSummary },
    ]);

    return { success: true, content: response.content };
  } catch (error) {
    console.error('Pathfinder error:', error);
    return {
      success: true,
      content: `**Your Path to ${nextTier.name} (Tier ${worker.tier + 1})**

Current: Tier ${worker.tier} — ${currentTier.name}

**Gap Analysis:**
- Jobs: Need ${nextTier.jobs} completed (currently building history)
- Quality Score: Need ${nextTier.qualityScore}+ (currently ${worker.quality_score})
${nextTier.licenseRequired ? `- License: Required for this tier — ${worker.tdlr_verified ? 'You have one!' : 'Get a TDLR license verified'}` : ''}

**Available Jobs Within Your Tier:**
${matchingJobs?.map(j => `- ${j.title} — ${j.budget_eth} ETH`).join('\n') || 'Check /jobs for open opportunities'}

*Set ANTHROPIC_API_KEY for personalized AI advice.*`,
    };
  }
}
