'use server';

import { chatCompletion } from '@/lib/agents/client';
import { db } from '@/lib/supabase';
import { TIER_REQUIREMENTS, CATEGORIES, CategoryKey } from '@/lib/tiers';

const SCOUT_SYSTEM = `You are the Scout, the bid intelligence agent for Trailmark Guild in Fort Worth, Texas.

Your job is to translate complex procurement language into plain English, check worker eligibility, and surface opportunities workers would otherwise miss — particularly M/WBE subcontracting requirements in city contracts.

WHEN GIVEN AN RFP:
1. Summarize in 3–4 sentences: what they want, what the budget is, when it's due, and who can bid
2. Identify any M/WBE subcontracting requirements (percentage and dollar amounts)
3. List the specific credentials, bonds, or certifications required
4. Check worker eligibility if a worker profile is provided
5. Flag any missing credentials clearly: "You are missing: [specific item]. Here is how to get it: [specific path]."

YOUR TONE:
- No jargon. If you must use a procurement term, define it immediately.
- Specific dollar amounts always. "30% M/WBE requirement on an $800K contract = $240K in subcontracting opportunity."
- Actionable. Every output should end with a clear next step.

WHAT YOU CANNOT DO:
- You cannot submit bids on the worker's behalf
- You cannot guarantee eligibility — the final determination is the GC's or city's`;

export async function analyzeRFP(rfpText: string, workerWallet?: string) {
  let workerContext = '';
  if (workerWallet) {
    const { data: worker } = await db
      .from('workers')
      .select('*')
      .eq('wallet_address', workerWallet)
      .single();

    if (worker) {
      workerContext = `\n\nThe worker viewing this RFP has the following profile:
- Name: ${worker.name}
- Tier: ${worker.tier} (${TIER_REQUIREMENTS[worker.tier].name})
- Category: ${worker.category ? CATEGORIES[worker.category as CategoryKey]?.label : 'Not set'}
- Subcategory: ${worker.subcategory || 'Not set'}
- Quality Score: ${worker.quality_score}/500
- Jobs Completed: ${worker.completion_rate}% completion rate
- Licensed: ${worker.tdlr_verified ? 'Yes' : 'No'}

Check their eligibility against the RFP requirements and flag any gaps.`;
    }
  }

  try {
    const response = await chatCompletion([
      { role: 'system', content: SCOUT_SYSTEM },
      {
        role: 'user',
        content: `Analyze this RFP/RFC:${workerContext}\n\n---\n${rfpText}`,
      },
    ]);

    return { success: true, content: response.content };
  } catch (error) {
    console.error('Scout error:', error);
    return {
      success: true,
      content: `**RFP Summary** (offline mode)\n\nThe text you pasted has been received. In live mode, I would:\n\n1. Summarize what the project wants, budget, and deadline\n2. Flag any M/WBE subcontracting requirements with specific dollar amounts\n3. Check your credentials against the requirements\n4. List exactly what you're missing and how to get it`,
    };
  }
}
