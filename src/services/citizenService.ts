// ============================================================================
// Citizen Service
// A citizen IS a deployed AI worker: custom name, archetype, granted tools and
// a standing job held in `config`. Deploying one is the core product action.
// ============================================================================

import { supabase } from './supabaseClient';
import type {
  Citizen,
  CitizenStats,
  TaskStatus,
  WorkerHealthStatus,
  CitizenStatus,
  CitizenConfig,
  CitizenMetrics,
  CreateCitizenInput,
  WorkerType,
  BusinessStream,
} from '../types';
import { DelphiTownError } from '../types';

function fail(error: unknown, context: string): never {
  const err = error as { message?: string; code?: string };
  throw new DelphiTownError(
    err?.code ?? 'CITIZEN_SERVICE_ERROR',
    `${context}: ${err?.message ?? 'unknown error'}`
  );
}

/** All citizens, optionally filtered by status. */
export async function getAllCitizens(status?: CitizenStatus): Promise<Citizen[]> {
  let query = supabase.from('citizens').select('*');
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) fail(error, 'getAllCitizens');
  return (data ?? []) as Citizen[];
}

export async function getCitizenById(citizenId: string): Promise<Citizen | null> {
  const { data, error } = await supabase
    .from('citizens')
    .select('*')
    .eq('id', citizenId)
    .maybeSingle();

  if (error) fail(error, 'getCitizenById');
  return (data as Citizen) ?? null;
}

/**
 * Deploy a citizen. This is the function the whole product is built around:
 * you name it, choose or write its role, grant its tools, define its standing
 * job, and place it in the town.
 *
 * Charter rule 2 is enforced here, not documented elsewhere: a citizen with no
 * explicitly granted tools is research-only by default.
 */
export interface DeployCitizenInput {
  name: string;
  worker_type: WorkerType;
  /** Optional display archetype, e.g. "Market Stall". */
  citizen_type?: string | null;
  business_stream?: BusinessStream | null;
  config?: CitizenConfig;
  x_position?: number | null;
  y_position?: number | null;
  sprite_key?: string | null;
}

export async function deployCitizen(input: DeployCitizenInput): Promise<Citizen> {
  if (!input.name?.trim()) {
    throw new DelphiTownError('INVALID_INPUT', 'Citizen name is required');
  }

  // Charter rule 2: research-only unless tools are explicitly granted.
  const config: CitizenConfig = {
    tools: [],
    skills: [],
    rules: [],
    ...input.config,
  };

  const { data, error } = await supabase
    .from('citizens')
    .insert([
      {
        name: input.name.trim(),
        worker_type: input.worker_type,
        citizen_type: input.citizen_type ?? null,
        business_stream: input.business_stream ?? null,
        config,
        status: 'IDLE' as CitizenStatus,
        is_enabled: true,
        x_position: input.x_position ?? null,
        y_position: input.y_position ?? null,
        sprite_key: input.sprite_key ?? null,
      },
    ])
    .select()
    .single();

  if (error) fail(error, 'deployCitizen');
  return data as Citizen;
}

/** Kept for existing callers (CitizenForm). Deploying is the same action. */
export async function createCitizen(input: CreateCitizenInput): Promise<Citizen> {
  return deployCitizen({
    name: input.name,
    worker_type: input.worker_type,
    citizen_type: input.citizen_type ?? null,
  });
}

export async function updateCitizen(
  citizenId: string,
  patch: Partial<
    Pick<
      Citizen,
      | 'name'
      | 'status'
      | 'citizen_type'
      | 'business_stream'
      | 'config'
      | 'is_enabled'
      | 'x_position'
      | 'y_position'
      | 'sprite_key'
    >
  >
): Promise<Citizen> {
  const { data, error } = await supabase
    .from('citizens')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', citizenId)
    .select()
    .single();

  if (error) fail(error, 'updateCitizen');
  return data as Citizen;
}

/** Stop a citizen without deleting it or losing its history. */
export async function retireCitizen(citizenId: string): Promise<Citizen> {
  return updateCitizen(citizenId, { is_enabled: false, status: 'OFFLINE' });
}

export async function getCitizenMetrics(): Promise<CitizenMetrics> {
  const { data, error } = await supabase
    .from('citizens')
    .select('status, revenue_lifetime, tasks_completed');

  if (error) fail(error, 'getCitizenMetrics');

  const rows = (data ?? []) as Array<{
    status: CitizenStatus;
    revenue_lifetime: number | null;
    tasks_completed: number | null;
  }>;

  const totalRevenue = rows.reduce((sum, r) => sum + (r.revenue_lifetime ?? 0), 0);

  return {
    total_citizens: rows.length,
    active_citizens: rows.filter(r => r.status === 'ACTIVE').length,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    avg_revenue_per_citizen:
      rows.length > 0 ? Math.round((totalRevenue / rows.length) * 100) / 100 : 0,
    total_tasks_completed: rows.reduce((sum, r) => sum + (r.tasks_completed ?? 0), 0),
  };
}

// ============================================================================
// Stats & health
// Absorbed from workerService when `workers` was merged into `citizens`
// (migration 0012). A citizen IS the worker, so these belong here.
// ============================================================================

/** Run statistics for a citizen, derived from its tasks. */
export async function getCitizenStats(citizenId: string): Promise<CitizenStats> {
  const { data, error } = await supabase
    .from('tasks')
    .select('status, actual_duration_seconds')
    .eq('citizen_id', citizenId);

  if (error) fail(error, 'getCitizenStats');

  const rows = (data ?? []) as Array<{
    status: TaskStatus;
    actual_duration_seconds: number | null;
  }>;
  const count = (st: TaskStatus) => rows.filter(r => r.status === st).length;

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
 * Latest health record for a citizen.
 * citizen_health is append-only history, so the newest row is current state.
 */
export async function getCitizenHealthStatus(
  citizenId: string
): Promise<{ status: WorkerHealthStatus; uptime_percentage?: number } | null> {
  const { data, error } = await supabase
    .from('citizen_health')
    .select('health_status, uptime_percentage')
    .eq('citizen_id', citizenId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) fail(error, 'getCitizenHealthStatus');
  if (!data) return null;

  const row = data;
  return {
    status: (row.health_status ?? 'OFFLINE').toUpperCase() as WorkerHealthStatus,
    uptime_percentage: row.uptime_percentage ?? undefined,
  };
}

/** Does this citizen's deploy-time grant cover the requested scope? (Rule 18) */
export function hasGrant(citizen: Citizen, scope: string): boolean {
  return citizen.config?.granted_scopes?.includes(scope) ?? false;
}

/** Remaining spend under the citizen's deploy-time budget. (Rule 11) */
export function budgetRemaining(citizen: Citizen, spentSoFar: number): number {
  const budget = citizen.config?.budget_usd ?? 0;
  return Math.max(0, budget - spentSoFar);
}
