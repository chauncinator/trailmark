'use server';

import { db } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

function actionSuccess<T>(data: T) {
  return { success: true as const, data };
}

function actionError(message: string) {
  return { success: false as const, error: message };
}

export async function getJobs(filters?: { category?: string; tier?: number; status?: string }) {
  let query = db.from('jobs').select('*, milestones(*)').order('created_at', { ascending: false });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.tier !== undefined) query = query.lte('tier_required', filters.tier);
  if (filters?.status) query = query.eq('status', filters.status);
  else query = query.neq('status', 'cancelled');

  const { data, error } = await query;

  if (error) return actionError(error.message);
  return actionSuccess(data);
}

export async function getJob(jobId: string) {
  const { data, error } = await db
    .from('jobs')
    .select('*, milestones(*)')
    .eq('id', jobId)
    .single();

  if (error) return actionError(error.message);
  return actionSuccess(data);
}

export async function applyToJob(jobId: string, workerWallet: string, coverNote: string) {
  const { data: existing } = await db
    .from('job_applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('worker_wallet', workerWallet)
    .single();

  if (existing) return actionError('Already applied to this job');

  const { error } = await db
    .from('job_applications')
    .insert({ job_id: jobId, worker_wallet: workerWallet, cover_note: coverNote });

  if (error) return actionError(error.message);
  revalidatePath(`/jobs/${jobId}`);
  return actionSuccess({ jobId });
}

export async function acceptWorker(jobId: string, workerWallet: string) {
  const { error: jobError } = await db
    .from('jobs')
    .update({ worker_wallet: workerWallet, status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (jobError) return actionError(jobError.message);

  const { error: appError } = await db
    .from('job_applications')
    .update({ status: 'accepted' })
    .eq('job_id', jobId)
    .eq('worker_wallet', workerWallet);

  if (appError) return actionError(appError.message);

  revalidatePath(`/jobs/${jobId}`);
  return actionSuccess({ jobId, workerWallet });
}

export async function fundEscrow(jobId: string) {
  const { error } = await db
    .from('jobs')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) return actionError(error.message);
  revalidatePath(`/jobs/${jobId}`);
  return actionSuccess({ jobId });
}

export async function confirmMilestone(jobId: string, milestoneId: string) {
  const { error } = await db
    .from('milestones')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', milestoneId);

  if (error) return actionError(error.message);

  const { data: milestones } = await db
    .from('milestones')
    .select('status')
    .eq('job_id', jobId);

  const allComplete = milestones?.every(m => m.status === 'complete');

  if (allComplete) {
    await db
      .from('jobs')
      .update({ status: 'complete', updated_at: new Date().toISOString() })
      .eq('id', jobId);
  }

  revalidatePath(`/jobs/${jobId}`);
  return actionSuccess({ milestoneId, jobComplete: allComplete });
}

export async function getJobApplications(jobId: string) {
  const { data, error } = await db
    .from('job_applications')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) return actionError(error.message);
  return actionSuccess(data);
}
