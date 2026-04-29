'use server';

import { chatCompletion, toGLMTool, type ChatMessage } from '@/lib/agents/client';
import { CATEGORIES, TIER_REQUIREMENTS } from '@/lib/tiers';
import { verifyTDLRLicense } from '@/lib/tdlr';
import { db } from '@/lib/supabase';

const TRAILBLAZER_SYSTEM = `You are the Trailblazer, the onboarding agent for Trailmark Guild — a decentralized labor marketplace in Fort Worth, Texas that gives workers on-chain reputation they own and bond coverage for jobs.

Your job is to guide a new worker through registration in a friendly, direct conversation. You are their first point of contact with the network.

WHAT YOU DO:
1. Ask the worker to describe what they do for work in their own words
2. Use get_categories() to identify the best category and subcategory match
3. If their category requires a license (electrical, plumbing, HVAC, roofing): ask for their TDLR license number and use check_tdlr_license() to verify it
4. Use get_tier_requirements() to explain exactly where they start and what they need to advance
5. Use suggest_vouching_candidates() to identify network members who could vouch for them
6. Summarize their profile and next steps clearly

YOUR TONE:
- Direct and practical — you respect that these are working people with limited time
- Specific, not generic — never say "keep working hard." Say "You need 3 more verified jobs and 2 peer attestations from Tier 1+ workers in Fort Worth."
- Encouraging without being patronizing
- Fort Worth-specific — you know the local trades, neighborhoods, and city context

WHAT YOU CANNOT DO:
- You cannot submit any forms or write any data — you populate information for the worker to confirm
- You cannot verify claims that aren't backed by the TDLR API
- You cannot promise specific job outcomes

Keep responses concise. Workers are often on their phones between jobs.`;

const tools = [
  toGLMTool('get_categories', 'Get the list of available work categories and subcategories', {
    type: 'object',
    properties: {},
    required: [],
  }),
  toGLMTool('check_tdlr_license', 'Verify a TDLR license number and return license details', {
    type: 'object',
    properties: {
      license_number: { type: 'string', description: 'TDLR license number to verify' },
    },
    required: ['license_number'],
  }),
  toGLMTool('get_tier_requirements', 'Get the requirements to reach a specific tier', {
    type: 'object',
    properties: {
      tier: { type: 'integer', description: 'Tier level (0-4)' },
    },
    required: ['tier'],
  }),
  toGLMTool('suggest_vouching_candidates', 'Find existing network members who could vouch for this worker', {
    type: 'object',
    properties: {
      category: { type: 'string' },
      location: { type: 'string' },
    },
    required: ['category', 'location'],
  }),
];

async function handleToolCall(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'get_categories':
      return Object.entries(CATEGORIES).map(([key, cat]) => ({
        key,
        label: cat.label,
        subcategories: cat.subcategories,
        requiresLicense: cat.requiresLicense,
      }));

    case 'check_tdlr_license':
      return await verifyTDLRLicense(input.license_number as string);

    case 'get_tier_requirements': {
      const tier = input.tier as number;
      return TIER_REQUIREMENTS.find(t => t.tier === tier) || TIER_REQUIREMENTS[0];
    }

    case 'suggest_vouching_candidates': {
      const { data } = await db
        .from('workers')
        .select('name, category, location, tier')
        .eq('category', input.category as string)
        .gte('tier', 1)
        .limit(5);
      return data || [];
    }

    default:
      return { error: 'Unknown tool' };
  }
}

export async function chatWithTrailblazer(messages: { role: 'user' | 'assistant'; content: string }[]) {
  try {
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: TRAILBLAZER_SYSTEM },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const response = await chatCompletion(apiMessages, tools);

    if (response.toolCalls && response.toolCalls.length > 0) {
      const updatedMessages: ChatMessage[] = [
        ...apiMessages,
        {
          role: 'assistant',
          content: response.content || '',
          tool_calls: response.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        },
      ];

      for (const tc of response.toolCalls) {
        const input = JSON.parse(tc.arguments);
        const result = await handleToolCall(tc.name, input);
        updatedMessages.push({
          role: 'tool' as const,
          content: JSON.stringify(result),
          tool_call_id: tc.id,
        });
      }

      const followUp = await chatCompletion(updatedMessages, tools);
      return { success: true, content: followUp.content };
    }

    return { success: true, content: response.content };
  } catch (error) {
    console.error('Trailblazer error:', error);
    return { success: false, content: 'Sorry, something went wrong. Please try again.' };
  }
}
