// ============================================================================
// Rate Limit Service
// Backed by the `rate_limits` table (one row per citizen, tiered quotas).
// Note: `rate_limit_quotas` is a second, competing implementation still in the
// schema - consolidating them is Phase 2.2. This service uses `rate_limits`.
// ============================================================================

import { supabase } from './supabaseClient';
import type { RateLimit, RateLimitCheckInput, RateLimitCheckResult } from '../types';
import { DelphiTownError } from '../types';

function fail(error: unknown, context: string): never {
  const err = error as { message?: string; code?: string };
  throw new DelphiTownError(
    err?.code ?? 'RATE_LIMIT_SERVICE_ERROR',
    `${context}: ${err?.message ?? 'unknown error'}`
  );
}

const TIER_MULTIPLIER = { free: 1, premium: 5, enterprise: 100 } as const;

export async function getQuota(citizenId: string): Promise<RateLimit | null> {
  const { data, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('citizen_id', citizenId)
    .maybeSingle();

  if (error) fail(error, 'getQuota');
  return (data as RateLimit) ?? null;
}

/**
 * Can this citizen start another run right now?
 * A citizen with no quota row is unrestricted - quotas are opt-in, so a missing
 * row must not silently block work.
 */
export async function checkRateLimit(
  input: RateLimitCheckInput
): Promise<RateLimitCheckResult> {
  const quantity = input.quantity ?? 1;
  const quota = await getQuota(input.citizen_id);

  if (!quota) {
    return {
      allowed: true,
      hourly_remaining: Infinity,
      daily_remaining: Infinity,
      resets_at: new Date().toISOString(),
      reason: 'No quota configured for this citizen',
    };
  }

  const now = Date.now();
  // A window that has already elapsed counts as reset.
  const hourlyUsed =
    new Date(quota.hourly_reset_at).getTime() <= now ? 0 : quota.hourly_used;
  const dailyUsed =
    new Date(quota.daily_reset_at).getTime() <= now ? 0 : quota.daily_used;

  const hourlyRemaining = Math.max(0, quota.hourly_quota - hourlyUsed);
  const dailyRemaining = Math.max(0, quota.daily_quota - dailyUsed);
  const allowed = hourlyRemaining >= quantity && dailyRemaining >= quantity;

  return {
    allowed,
    hourly_remaining: hourlyRemaining,
    daily_remaining: dailyRemaining,
    resets_at: hourlyRemaining < quantity ? quota.hourly_reset_at : quota.daily_reset_at,
    reason: allowed
      ? undefined
      : `Rate limit exceeded. ${hourlyRemaining} hourly, ${dailyRemaining} daily remaining.`,
  };
}

/** Record consumption after a run is created. Resets elapsed windows. */
export async function recordQuotaUsage(
  citizenId: string,
  quantity = 1
): Promise<RateLimit | null> {
  const quota = await getQuota(citizenId);
  if (!quota) return null;

  const now = Date.now();
  const hourlyElapsed = new Date(quota.hourly_reset_at).getTime() <= now;
  const dailyElapsed = new Date(quota.daily_reset_at).getTime() <= now;

  const patch = {
    hourly_used: (hourlyElapsed ? 0 : quota.hourly_used) + quantity,
    daily_used: (dailyElapsed ? 0 : quota.daily_used) + quantity,
    hourly_reset_at: hourlyElapsed
      ? new Date(now + 60 * 60 * 1000).toISOString()
      : quota.hourly_reset_at,
    daily_reset_at: dailyElapsed
      ? new Date(now + 24 * 60 * 60 * 1000).toISOString()
      : quota.daily_reset_at,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('rate_limits')
    .update(patch)
    .eq('citizen_id', citizenId)
    .select()
    .single();

  if (error) fail(error, 'recordQuotaUsage');
  return data as RateLimit;
}

/** Throws if the citizen is over quota. Use before creating a run. */
export async function enforceRateLimit(input: RateLimitCheckInput): Promise<void> {
  const result = await checkRateLimit(input);
  if (!result.allowed) {
    throw new DelphiTownError(
      'RATE_LIMIT_EXCEEDED',
      result.reason ?? 'Rate limit exceeded',
      { resets_at: result.resets_at }
    );
  }
}

export async function setTier(
  citizenId: string,
  tier: keyof typeof TIER_MULTIPLIER,
  baseHourly = 10,
  baseDaily = 100
): Promise<RateLimit> {
  const multiplier = TIER_MULTIPLIER[tier];
  const { data, error } = await supabase
    .from('rate_limits')
    .update({
      tier,
      hourly_quota: baseHourly * multiplier,
      daily_quota: baseDaily * multiplier,
      updated_at: new Date().toISOString(),
    })
    .eq('citizen_id', citizenId)
    .select()
    .single();

  if (error) fail(error, 'setTier');
  return data as RateLimit;
}
