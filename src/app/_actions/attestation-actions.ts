'use server';

import { db } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

function actionSuccess<T>(data: T) {
  return { success: true as const, data };
}

function actionError(message: string) {
  return { success: false as const, error: message };
}

export async function createAttestation(data: {
  worker_wallet: string;
  attester_wallet: string;
  credential_type: string;
  category: string;
  subcategory?: string;
  external_ref?: string;
  stake_amount?: number;
}) {
  const { error } = await db.from('attestations').insert({
    worker_wallet: data.worker_wallet,
    attester_wallet: data.attester_wallet,
    credential_type: data.credential_type,
    category: data.category,
    subcategory: data.subcategory || null,
    external_ref: data.external_ref || null,
    stake_amount: data.stake_amount || 0,
  });

  if (error) return actionError(error.message);
  revalidatePath('/profile');
  return actionSuccess({ created: true });
}

export async function getAttestationsForWorker(workerWallet: string) {
  const { data, error } = await db
    .from('attestations')
    .select('*')
    .eq('worker_wallet', workerWallet)
    .order('issued_at', { ascending: false });

  if (error) return actionError(error.message);
  return actionSuccess(data);
}
