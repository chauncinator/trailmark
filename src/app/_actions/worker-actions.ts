'use server';

import { db } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

function actionSuccess<T>(data: T) {
  return { success: true as const, data };
}

function actionError(message: string) {
  return { success: false as const, error: message };
}

export async function upsertWorker(walletAddress: string, data: {
  name?: string;
  bio?: string;
  location?: string;
  category?: string;
  subcategory?: string;
  tdlr_license_number?: string;
  tdlr_verified?: boolean;
  tdlr_expires_at?: string;
  tier?: number;
}) {
  const { data: existing } = await db
    .from('workers')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (existing) {
    const { error } = await db
      .from('workers')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('wallet_address', walletAddress);

    if (error) return actionError(error.message);
    revalidatePath('/onboarding');
    revalidatePath('/profile');
    return actionSuccess({ walletAddress, updated: true });
  }

  const { error } = await db
    .from('workers')
    .insert({ wallet_address: walletAddress, ...data });

  if (error) return actionError(error.message);
  revalidatePath('/onboarding');
  return actionSuccess({ walletAddress, updated: false });
}

export async function getWorker(walletAddress: string) {
  const { data, error } = await db
    .from('workers')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error) return actionError(error.message);
  return actionSuccess(data);
}

export async function getWorkersByCategory(category: string) {
  const { data, error } = await db
    .from('workers')
    .select('*')
    .eq('category', category);

  if (error) return actionError(error.message);
  return actionSuccess(data);
}
