import { db } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.method === 'tools/list') {
    return NextResponse.json({
      tools: [
        {
          name: 'trailmark_find_workers',
          description: 'Find verified Trailmark workers by category, tier, and location',
          inputSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Work category (e.g. electrical, web_dev, tutoring, landscaping)' },
              tier_minimum: { type: 'integer', description: 'Minimum tier (0-4)', default: 0 },
              location: { type: 'string', description: 'Fort Worth neighborhood or ZIP' },
              job_value: { type: 'number', description: 'Job value in ETH — determines bond coverage requirement' },
            },
          },
        },
        {
          name: 'trailmark_get_jobs',
          description: 'Get open jobs on the Trailmark marketplace',
          inputSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Filter by work category' },
              tier_required: { type: 'integer', description: 'Maximum tier required' },
            },
          },
        },
        {
          name: 'trailmark_get_worker_profile',
          description: 'Get a worker\'s full reputation profile including tier, scores, and credentials',
          inputSchema: {
            type: 'object',
            properties: {
              wallet_address: { type: 'string', description: 'Worker wallet address' },
            },
            required: ['wallet_address'],
          },
        },
      ],
    });
  }

  if (body.method === 'tools/call') {
    const { name, arguments: args } = body.params || {};

    if (name === 'trailmark_find_workers') {
      let query = db.from('workers').select('*').gte('tier', args?.tier_minimum || 0);

      if (args?.category) query = query.eq('category', args.category);
      if (args?.location) query = query.ilike('location', `%${args.location}%`);

      query = query.order('tier', { ascending: false }).limit(10);

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ content: [{ type: 'text', text: `Error: ${error.message}` }] });
      }

      const result = (data || []).map((w: Record<string, unknown>) => ({
        name: w.name,
        tier: w.tier,
        category: w.category,
        subcategory: w.subcategory,
        location: w.location,
        quality_score: w.quality_score,
        completion_rate: w.completion_rate,
        licensed: w.tdlr_verified,
      }));

      return NextResponse.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      });
    }

    if (name === 'trailmark_get_jobs') {
      let query = db.from('jobs').select('*, milestones(*)').eq('status', 'open');

      if (args?.category) query = query.eq('category', args.category);
      if (args?.tier_required !== undefined) query = query.lte('tier_required', args.tier_required);

      query = query.order('created_at', { ascending: false }).limit(10);

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ content: [{ type: 'text', text: `Error: ${error.message}` }] });
      }

      return NextResponse.json({
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      });
    }

    if (name === 'trailmark_get_worker_profile') {
      const { data: worker } = await db
        .from('workers')
        .select('*')
        .eq('wallet_address', args.wallet_address)
        .single();

      if (!worker) {
        return NextResponse.json({ content: [{ type: 'text', text: 'Worker not found' }] });
      }

      const { data: attestations } = await db
        .from('attestations')
        .select('*')
        .eq('worker_wallet', args.wallet_address);

      return NextResponse.json({
        content: [{
          type: 'text',
          text: JSON.stringify({ ...worker, attestations: attestations || [] }, null, 2),
        }],
      });
    }

    return NextResponse.json({ content: [{ type: 'text', text: `Unknown tool: ${name}` }] });
  }

  return NextResponse.json({ error: 'Unknown method' }, { status: 400 });
}
