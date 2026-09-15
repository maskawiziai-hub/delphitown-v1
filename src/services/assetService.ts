// ============================================================================
// Asset Service - reads the assets_manifest table.
// Written fresh against the live schema rather than ported: the version in the
// second codebase targeted a different asset shape.
// ============================================================================

import { supabase } from './supabaseClient';
import type { AssetManifest } from '../types';
import { DelphiTownError } from '../types';

function fail(error: unknown, context: string): never {
  const err = error as { message?: string; code?: string };
  throw new DelphiTownError(
    err?.code ?? 'ASSET_SERVICE_ERROR',
    `${context}: ${err?.message ?? 'unknown error'}`
  );
}

/** Every non-deprecated asset, keyed by asset_key for O(1) lookup. */
export async function fetchManifest(): Promise<Map<string, AssetManifest>> {
  const { data, error } = await supabase
    .from('assets_manifest')
    .select('*')
    .eq('is_deprecated', false);

  if (error) fail(error, 'fetchManifest');

  const map = new Map<string, AssetManifest>();
  for (const row of (data ?? []) as AssetManifest[]) {
    map.set(row.asset_key, row);
  }
  return map;
}

export async function getAssetByKey(assetKey: string): Promise<AssetManifest | null> {
  const { data, error } = await supabase
    .from('assets_manifest')
    .select('*')
    .eq('asset_key', assetKey)
    .eq('is_deprecated', false)
    .maybeSingle();

  if (error) fail(error, 'getAssetByKey');
  return (data as AssetManifest) ?? null;
}

export async function getAssetsByCategory(category: string): Promise<AssetManifest[]> {
  const { data, error } = await supabase
    .from('assets_manifest')
    .select('*')
    .eq('category', category)
    .eq('is_deprecated', false)
    .order('asset_name');

  if (error) fail(error, 'getAssetsByCategory');
  return (data ?? []) as AssetManifest[];
}

/** Sprite key convention: sprite_{worker_type}_{state} */
export function spriteKeyFor(workerType: string, state: 'idle' | 'working' | 'error'): string {
  return `sprite_${workerType}_${state}`;
}
