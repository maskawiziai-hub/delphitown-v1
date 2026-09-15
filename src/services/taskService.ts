// ============================================================================
// Task Service
// A "task" is a RUN of a citizen's standing job - not a queue item waiting to
// be claimed. Queries are written against the live schema (see
// supabase/migrations/0001_baseline_schema.sql + 0004).
// ============================================================================

import { supabase } from './supabaseClient';
import type {
  Task,
  TaskStatus,
  TaskMetrics,
  QueueTaskInput,
  UpdateTaskStatusInput,
} from '../types';
import { DelphiTownError } from '../types';

function fail(error: unknown, context: string): never {
  const err = error as { message?: string; code?: string };
  throw new DelphiTownError(
    err?.code ?? 'TASK_SERVICE_ERROR',
    `${context}: ${err?.message ?? 'unknown error'}`
  );
}

/** Every task in the system, newest first. */
export async function getAllTasks(limit = 100): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('queued_at', { ascending: false })
    .limit(limit);

  if (error) fail(error, 'getAllTasks');
  return (data ?? []) as Task[];
}

/** Runs belonging to one citizen. */
export async function getCitizenTaskQueue(citizenId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('citizen_id', citizenId)
    .order('queued_at', { ascending: false });

  if (error) fail(error, 'getCitizenTaskQueue');
  return (data ?? []) as Task[];
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle();

  if (error) fail(error, 'getTaskById');
  return (data as Task) ?? null;
}

/** Record a new run. priority is an integer 1-10 (DB CHECK); default 5. */
export async function queueTask(input: QueueTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        citizen_id: input.citizen_id,
        worker_id: input.worker_id ?? null,
        task_type: input.task_type,
        status: 'QUEUED' as TaskStatus,
        priority: input.priority ?? 5,
        payload: input.payload ?? {},
        estimated_duration_seconds: input.estimated_duration_seconds ?? null,
      },
    ])
    .select()
    .single();

  if (error) fail(error, 'queueTask');
  return data as Task;
}

/** Alias kept for callers that speak in tasks rather than runs. */
export const createTask = queueTask;

export async function updateTaskStatus(input: UpdateTaskStatusInput): Promise<Task> {
  const patch: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.status === 'RUNNING') patch.started_at = new Date().toISOString();
  if (input.status === 'COMPLETED' || input.status === 'FAILED') {
    patch.completed_at = new Date().toISOString();
  }
  if (input.actual_duration_seconds !== undefined) {
    patch.actual_duration_seconds = input.actual_duration_seconds;
  }
  if (input.output_data !== undefined) patch.output_data = input.output_data;
  if (input.error_message !== undefined) patch.error_message = input.error_message;

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', input.task_id)
    .select()
    .single();

  if (error) fail(error, 'updateTaskStatus');
  return data as Task;
}

/** Re-queue a failed run, respecting max_retries. */
export async function retryTask(taskId: string): Promise<Task> {
  const existing = await getTaskById(taskId);
  if (!existing) {
    throw new DelphiTownError('TASK_NOT_FOUND', `Task ${taskId} not found`);
  }
  if (existing.retry_count >= existing.max_retries) {
    throw new DelphiTownError(
      'RETRY_LIMIT_REACHED',
      `Task ${taskId} has used all ${existing.max_retries} retries`
    );
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'RETRYING',
      retry_count: existing.retry_count + 1,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) fail(error, 'retryTask');
  return data as Task;
}

export async function getTaskMetrics(citizenId?: string): Promise<TaskMetrics> {
  let query = supabase.from('tasks').select('status, actual_duration_seconds');
  if (citizenId) query = query.eq('citizen_id', citizenId);

  const { data, error } = await query;
  if (error) fail(error, 'getTaskMetrics');

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
    total_queued: count('QUEUED'),
    total_running: count('RUNNING'),
    total_completed: completed,
    total_failed: failed,
    success_rate: finished > 0 ? Math.round((completed / finished) * 100) : 0,
    avg_duration_seconds:
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
  };
}
