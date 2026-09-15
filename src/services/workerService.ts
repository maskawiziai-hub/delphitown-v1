// ============================================================================
// Worker Service
// Worker registry, health and per-worker run statistics.
// ============================================================================

import { supabase } from './supabaseClient';
import type { Worker, WorkerType, WorkerStats, WorkerHealthStatus, TaskStatus } from '../types';
import { DelphiTownError } from '../types';

function fail(error: unknown, context: string): never {
  const err = error as { message?: string; code?: string };
  throw new DelphiTownError(
    err?.code ?? 'WORKER_SERVICE_ERROR',
    `${context}: ${err?.message ?? 'unknown error'}`
  );
}

export async function getAllWorkers(workerType?: WorkerType): Promise<Worker[]> {
  let query = supabase.from('workers').select('*');
  if (workerType) query = query.eq('worker_type', workerType);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) fail(error, 'getAllWorkers');
  return (data ?? []) as Worker[];
}

export async function getWorkerById(workerId: string): Promise<Worker | null> {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('id', workerId)
    .maybeSingle();

  if (error) fail(error, 'getWorkerById');
  return (data as Worker) ?? null;
}

/** Run statistics derived from the tasks table. */
export async function getWorkerStats(workerId: string): Promise<WorkerStats> {
  const { data, error } = await supabase
    .from('tasks')
    .select('status, actual_duration_seconds')
    .eq('worker_id', workerId);

  if (error) fail(error, 'getWorkerStats');

  const rows = (data ?? []) as Array<{
    status: TaskStatus;
    actual_duration_seconds: number | null;
  }>;
  const count = (s: TaskStatus) => rows.filter(r => r.status === s).length;

  const completed = count('COMPLETED');
  const failed = count('FAILED');
  const finished = completed + failed;
  const durations = rows
    .map(r => r.actual_duration_seconds)
    .filter((d): d is number => typeof d === 'number');

  return {
    active_tasks: count('RUNNING') + count('QUEUED'),
    completed_tasks: completed,
    failed_tasks: failed,
    success_rate: finished > 0 ? Math.round((completed / finished) * 100) : 0,
    avg_task_duration:
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
  };
}

/**
 * Latest health record for a worker.
 * worker_health is append-only history (the UNIQUE constraint was dropped in
 * migration 0004), so the newest row is the current state.
 */
export async function getWorkerHealthStatus(
  workerId: string
): Promise<{ status: WorkerHealthStatus; uptime_percentage?: number } | null> {
  const { data, error } = await supabase
    .from('worker_health')
    .select('health_status, uptime_percentage')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) fail(error, 'getWorkerHealthStatus');
  if (!data) return null;

  const row = data;
  return {
    status: (row.health_status ?? 'OFFLINE').toUpperCase() as WorkerHealthStatus,
    uptime_percentage: row.uptime_percentage ?? undefined,
  };
}

export async function updateWorkerStatus(
  workerId: string,
  status: string
): Promise<Worker> {
  const { data, error } = await supabase
    .from('workers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', workerId)
    .select()
    .single();

  if (error) fail(error, 'updateWorkerStatus');
  return data as Worker;
}
