// ============================================================================
// Revenue Service - Manages revenue ledger, aggregations, and exports
// Append-only immutable ledger with aggregations
// ============================================================================

import { supabase } from './supabaseClient';
import {
  Revenue,
  RecordRevenueInput,
  RevenueAggregation,
  RevenueStats,
  Cost,
  RecordCostInput,
  StreamPnL,
  SourcePnL,
  RevenueSource,
  TaskType,
  DelphiTownError
} from '../types';

// ============================================================================
// Error Handling
// ============================================================================

function handleSupabaseError(error: unknown, context: string): never {
  const err = error as any;
  const message = err?.message || String(error);
  console.error(`Revenue Service Error [${context}]:`, message);
  throw new DelphiTownError('REVENUE_SERVICE_ERROR', message, { context });
}

// ============================================================================
// Revenue Recording (Append-Only)
// ============================================================================

/**
 * Record a revenue transaction (immutable append-only)
 * Citizen revenue_lifetime is automatically updated
 */
export async function recordRevenue(input: RecordRevenueInput): Promise<Revenue> {
  try {
    const now = new Date();

    const revenueData = {
      citizen_id: input.citizen_id,
      worker_id: input.worker_id,
      task_type: input.task_type,
      amount: input.amount,
      currency: input.currency || 'USD',
      source: input.source || 'task_completion',
      recorded_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from('revenue')
      .insert([revenueData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'recordRevenue');

    console.log(`✓ Revenue recorded: ${data.citizen_id} +$${data.amount}`);

    // Update citizen lifetime revenue (atomic; see migration 0006)
    const { error: incErr } = await supabase.rpc('increment_citizen_revenue', {
      p_citizen_id: input.citizen_id,
      p_amount: input.amount,
    });
    if (incErr) handleSupabaseError(incErr, 'recordRevenue:increment');

    return data;
  } catch (error) {
    handleSupabaseError(error, 'recordRevenue');
  }
}

/**
 * Record multiple revenue transactions in batch
 */
export async function recordRevenuesBatch(inputs: RecordRevenueInput[]): Promise<Revenue[]> {
  try {
    const now = new Date();
    const revenueData = inputs.map(input => ({
      citizen_id: input.citizen_id,
      worker_id: input.worker_id,
      task_type: input.task_type,
      amount: input.amount,
      currency: input.currency || 'USD',
      source: input.source || 'task_completion',
      recorded_at: now.toISOString(),
    }));

    const { data, error } = await supabase
      .from('revenue')
      .insert(revenueData)
      .select();

    if (error) handleSupabaseError(error, 'recordRevenuesBatch');

    // Update citizen revenues in batch
    const citizenUpdates = new Map<string, number>();
    inputs.forEach(input => {
      citizenUpdates.set(
        input.citizen_id,
        (citizenUpdates.get(input.citizen_id) || 0) + input.amount
      );
    });

    for (const [citizenId, amount] of citizenUpdates) {
      const { error: incErr } = await supabase.rpc('increment_citizen_revenue', {
        p_citizen_id: citizenId,
        p_amount: amount,
      });
      if (incErr) handleSupabaseError(incErr, 'recordRevenuesBatch:increment');
    }

    console.log(`✓ Batch revenue recorded: ${data.length} transactions`);

    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'recordRevenuesBatch');
  }
}

// ============================================================================
// Revenue Query Operations
// ============================================================================

/**
 * Get all revenue transactions (paginated)
 */
export async function getAllRevenue(limit: number = 100, offset: number = 0): Promise<Revenue[]> {
  try {
    const { data, error } = await supabase
      .from('revenue')
      .select('*')
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) handleSupabaseError(error, 'getAllRevenue');

    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'getAllRevenue');
  }
}

/**
 * Get revenue for a specific citizen
 */
export async function getCitizenRevenue(
  citizenId: string,
  limit: number = 100
): Promise<Revenue[]> {
  try {
    const { data, error } = await supabase
      .from('revenue')
      .select('*')
      .eq('citizen_id', citizenId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error, 'getCitizenRevenue');

    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'getCitizenRevenue');
  }
}

/**
 * Get revenue within a date range
 */
export async function getRevenueByDateRange(
  startDate: string,
  endDate: string
): Promise<Revenue[]> {
  try {
    const { data, error } = await supabase
      .from('revenue')
      .select('*')
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate)
      .order('recorded_at', { ascending: false });

    if (error) handleSupabaseError(error, 'getRevenueByDateRange');

    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'getRevenueByDateRange');
  }
}

/**
 * Get revenue by task type
 */
export async function getRevenueByTaskType(taskType: TaskType): Promise<Revenue[]> {
  try {
    const { data, error } = await supabase
      .from('revenue')
      .select('*')
      .eq('task_type', taskType)
      .order('recorded_at', { ascending: false });

    if (error) handleSupabaseError(error, 'getRevenueByTaskType');

    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'getRevenueByTaskType');
  }
}

/**
 * Get revenue from a specific worker
 */
export async function getRevenueByWorker(workerId: string): Promise<Revenue[]> {
  try {
    const { data, error } = await supabase
      .from('revenue')
      .select('*')
      .eq('worker_id', workerId)
      .order('recorded_at', { ascending: false });

    if (error) handleSupabaseError(error, 'getRevenueByWorker');

    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'getRevenueByWorker');
  }
}

// ============================================================================
// Revenue Aggregations
// ============================================================================

/**
 * Get total revenue by citizen
 */
export async function getRevenueAggregationByCitizen(): Promise<RevenueAggregation[]> {
  try {
    const { data, error } = await supabase
      .from('revenue_by_citizen')
      .select('*')
      .order('total_amount', { ascending: false });

    if (error) handleSupabaseError(error, 'getRevenueAggregationByCitizen');

    return (data || []).map((row: any) => ({
      citizen_id: row.citizen_id,
      total_amount: row.total_amount,
      transaction_count: row.transaction_count,
      average_transaction: row.average_transaction,
    }));
  } catch (error) {
    handleSupabaseError(error, 'getRevenueAggregationByCitizen');
  }
}

/**
 * Get total revenue by task type
 */
export async function getRevenueAggregationByTaskType(): Promise<RevenueAggregation[]> {
  try {
    const { data, error } = await supabase
      .from('revenue_by_task_type')
      .select('*')
      .order('total_amount', { ascending: false });

    if (error) handleSupabaseError(error, 'getRevenueAggregationByTaskType');

    return (data || []).map((row: any) => ({
      task_type: row.task_type,
      total_amount: row.total_amount,
      transaction_count: row.transaction_count,
      average_transaction: row.average_transaction,
    }));
  } catch (error) {
    handleSupabaseError(error, 'getRevenueAggregationByTaskType');
  }
}

/**
 * Get total revenue by date (daily aggregation)
 */
export async function getRevenueAggregationByDate(): Promise<RevenueAggregation[]> {
  try {
    const { data, error } = await supabase
      .from('revenue')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (error) handleSupabaseError(error, 'getRevenueAggregationByDate');

    // Manual grouping by date
    const byDate = new Map<string, { sum: number; count: number }>();

    (data || []).forEach((revenue: Revenue) => {
      const date = revenue.recorded_at.split('T')[0];
      const current = byDate.get(date) || { sum: 0, count: 0 };
      byDate.set(date, {
        sum: current.sum + revenue.amount,
        count: current.count + 1,
      });
    });

    return Array.from(byDate.entries()).map(([date, stats]) => ({
      date,
      total_amount: stats.sum,
      transaction_count: stats.count,
      average_transaction: stats.sum / stats.count,
    }));
  } catch (error) {
    handleSupabaseError(error, 'getRevenueAggregationByDate');
  }
}

/**
 * Get combined revenue summary (total, average, transaction count)
 */
export async function getRevenueSummary(
  from?: string,
  to?: string
): Promise<RevenueStats> {
  // Computed in the database (migration 0008). The previous version pulled
  // every revenue row into the browser and aggregated there - fine at zero
  // rows, untenable later - and had no concept of costs at all.
  const { data, error } = await supabase.rpc('get_pnl_summary', {
    p_from: from ?? null,
    p_to: to ?? null,
  });

  if (error) handleSupabaseError(error, 'getRevenueSummary');

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;

  const num = (v: unknown): number => {
    const n = typeof v === 'string' ? parseFloat(v) : (v as number);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    total_revenue: num(row?.total_revenue),
    total_costs: num(row?.total_costs),
    net_revenue: num(row?.net_revenue),
    profit_margin_pct: num(row?.profit_margin_pct),
    total_transactions: num(row?.total_transactions),
    average_transaction: num(row?.average_transaction),
    average_daily: num(row?.average_daily),
    unique_citizens: num(row?.unique_citizens),
    active_days: num(row?.active_days),
  };
}

// ============================================================================
// Costs - the other half of the ledger (migration 0007)
// ============================================================================

/** Record an expense: API spend, cost of goods, subscription, platform fee. */
export async function recordCost(input: RecordCostInput): Promise<Cost> {
  const { data, error } = await supabase
    .from('costs')
    .insert([
      {
        citizen_id: input.citizen_id ?? null,
        task_id: input.task_id ?? null,
        cost_type: input.cost_type,
        amount: input.amount,
        currency: input.currency ?? 'USD',
        description: input.description ?? null,
        is_recurring: input.is_recurring ?? false,
      },
    ])
    .select()
    .single();

  if (error) handleSupabaseError(error, 'recordCost');
  return data as Cost;
}

/**
 * Profit and loss per business stream - collectibles, gta6, lofi, and so on -
 * in one query. A stream with costs but no revenue still appears, because that
 * is precisely the case worth seeing.
 */
export async function getPnLByStream(
  from?: string,
  to?: string
): Promise<StreamPnL[]> {
  const { data, error } = await supabase.rpc('get_pnl_by_stream', {
    p_from: from ?? null,
    p_to: to ?? null,
  });

  if (error) handleSupabaseError(error, 'getPnLByStream');

  const num = (v: unknown): number => {
    const n = typeof v === 'string' ? parseFloat(v) : (v as number);
    return Number.isFinite(n) ? n : 0;
  };

  return ((data ?? []) as Array<Record<string, unknown>>).map(row => ({
    business_stream:
      typeof row.business_stream === 'string' ? row.business_stream : 'unassigned',
    total_revenue: num(row.total_revenue),
    total_costs: num(row.total_costs),
    net_revenue: num(row.net_revenue),
    profit_margin_pct: num(row.profit_margin_pct),
    transaction_count: num(row.transaction_count),
    citizen_count: num(row.citizen_count),
  }));
}

/**
 * Revenue per sales channel.
 * @param citizenId scope to a single worker - answers "which channel is THIS
 *                  citizen actually earning on?"
 * @param stream    scope to one business instead
 */
export async function getRevenueBySource(
  citizenId?: string,
  stream?: string,
  from?: string,
  to?: string
): Promise<SourcePnL[]> {
  const { data, error } = await supabase.rpc('get_revenue_by_source', {
    p_citizen_id: citizenId ?? null,
    p_stream: stream ?? null,
    p_from: from ?? null,
    p_to: to ?? null,
  });

  if (error) handleSupabaseError(error, 'getRevenueBySource');

  const num = (v: unknown): number => {
    const n = typeof v === 'string' ? parseFloat(v) : (v as number);
    return Number.isFinite(n) ? n : 0;
  };

  return ((data ?? []) as Array<Record<string, unknown>>).map(row => ({
    source: typeof row.source === 'string' ? row.source : 'other',
    display_name:
      typeof row.display_name === 'string' ? row.display_name : 'Other',
    total_amount: num(row.total_amount),
    transaction_count: num(row.transaction_count),
    average_transaction: num(row.average_transaction),
    share_pct: num(row.share_pct),
  }));
}

/** Active sales channels, for populating a source dropdown. */
export async function getRevenueSources(): Promise<RevenueSource[]> {
  const { data, error } = await supabase
    .from('revenue_sources')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) handleSupabaseError(error, 'getRevenueSources');
  return (data ?? []) as RevenueSource[];
}

export async function getAllCosts(limit = 100): Promise<Cost[]> {
  const { data, error } = await supabase
    .from('costs')
    .select('*')
    .order('incurred_at', { ascending: false })
    .limit(limit);

  if (error) handleSupabaseError(error, 'getAllCosts');
  return (data ?? []) as Cost[];
}

/** Spend grouped by category, largest first. */
export async function getCostBreakdown(): Promise<
  Array<{ cost_type: string; total_amount: number; count: number }>
> {
  const { data, error } = await supabase.from('costs').select('cost_type, amount');
  if (error) handleSupabaseError(error, 'getCostBreakdown');

  const byType = new Map<string, { total: number; count: number }>();
  for (const row of (data ?? []) as Array<{ cost_type: string; amount: number }>) {
    const entry = byType.get(row.cost_type) ?? { total: 0, count: 0 };
    entry.total += Number(row.amount) || 0;
    entry.count += 1;
    byType.set(row.cost_type, entry);
  }

  return Array.from(byType.entries())
    .map(([cost_type, v]) => ({
      cost_type,
      total_amount: Math.round(v.total * 100) / 100,
      count: v.count,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);
}

export async function exportRevenueAsCSV(
  citizenId?: string,
  dateStart?: string,
  dateEnd?: string
): Promise<string> {
  try {
    let query = supabase.from('revenue').select('*');

    if (citizenId) {
      query = query.eq('citizen_id', citizenId);
    }
    if (dateStart) {
      query = query.gte('recorded_at', dateStart);
    }
    if (dateEnd) {
      query = query.lte('recorded_at', dateEnd);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });

    if (error) handleSupabaseError(error, 'exportRevenueAsCSV');

    const revenues = data || [];

    // Build CSV
    const csv = [
      ['Citizen ID', 'Worker ID', 'Task Type', 'Amount', 'Currency', 'Source', 'Recorded At'].join(','),
      ...revenues.map(r =>
        [
          r.citizen_id,
          r.worker_id,
          r.task_type,
          r.amount,
          r.currency,
          r.source,
          r.recorded_at,
        ].join(',')
      ),
    ].join('\n');

    return csv;
  } catch (error) {
    handleSupabaseError(error, 'exportRevenueAsCSV');
  }
}

/**
 * Export revenue data as JSON
 */
export async function exportRevenueAsJSON(
  citizenId?: string,
  dateStart?: string,
  dateEnd?: string
): Promise<object> {
  try {
    let query = supabase.from('revenue').select('*');

    if (citizenId) {
      query = query.eq('citizen_id', citizenId);
    }
    if (dateStart) {
      query = query.gte('recorded_at', dateStart);
    }
    if (dateEnd) {
      query = query.lte('recorded_at', dateEnd);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });

    if (error) handleSupabaseError(error, 'exportRevenueAsJSON');

    const summary = await getRevenueSummary();

    return {
      export_date: new Date().toISOString(),
      summary,
      transactions: data || [],
    };
  } catch (error) {
    handleSupabaseError(error, 'exportRevenueAsJSON');
  }
}

// ============================================================================
// Realtime Subscriptions
// ============================================================================
// REMOVED 2026-09-15. subscribeToRevenueChanges() and
// subscribeToCitizenRevenueChanges() used the Supabase v1 API
// (supabase.from(t).on(evt, cb).subscribe()). That method does not exist on
// the installed v2 client and threw a TypeError whenever called - this was
// BUG-001, reported closed in Phase 2 but still present in this file.
// Use the hooks in ./useRealtimeSubscription instead.
