// ============================================================================
// Core Type Definitions for DelphiTown v1
// ============================================================================

/** Pre-built archetypes. Custom values are allowed - citizens are deployed
 *  with whatever role you define, so this must never be a closed list.
 *  `(string & {})` keeps editor autocomplete for the known values while
 *  still accepting any string. */
export type KnownWorkerType =
  | 'collectibles_hunter'
  | 'gta6_content_creator'
  | 'osrs_farmer'
  | 'dropshipping_scout'
  | 'lofi_producer'
  | 'pixel_artist'
  | 'pod_designer';

export type WorkerType = KnownWorkerType | (string & {});

export type BusinessStream =
  | 'collectibles'
  | 'gta6'
  | 'osrs'
  | 'dropshipping'
  | 'lofi'
  | 'pixel-assets'
  | 'print-on-demand'
  | (string & {});

export type KnownTaskType =
  | 'hunt_collectible'
  | 'create_gta6_video'
  | 'farm_osrs_items'
  | 'source_dropship_products'
  | 'produce_lofi_track'
  | 'design_pixel_sprite'
  | 'create_pod_design';

export type TaskType = KnownTaskType | (string & {});

/** Optional display archetype shown in the town ("Market Stall", "Scholar").
 *  Free text - there is no fixed set. The old 'human' | 'bot' | 'hybrid'
 *  classification was removed: every citizen is a deployed AI worker, so the
 *  distinction described nothing and broke every config lookup. */
export type CitizenType = string;

/** Task priority is stored as an integer 1-10 (DB CHECK constraint), which
 *  sorts and compares correctly. Labels are for display only. */
export type PriorityLabel = 'LOW' | 'MEDIUM' | 'HIGH';

export const PRIORITY = { LOW: 2, MEDIUM: 5, HIGH: 8 } as const;

export function priorityLabel(priority: number | null | undefined): PriorityLabel {
  if (typeof priority !== 'number') return 'MEDIUM';
  if (priority >= 7) return 'HIGH';
  if (priority >= 4) return 'MEDIUM';
  return 'LOW';
}

export type TaskStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'STUCK'
  | 'RETRYING'
  | 'CANCELLED'
  | 'TIMEOUT';

export type CitizenStatus =
  | 'ACTIVE'
  | 'IDLE'
  | 'RESTING'
  | 'OFFLINE'
  | 'BANNED';

export type WorkerHealthStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'CRITICAL'
  | 'OFFLINE';

// ============================================================================
// Entity Models
// ============================================================================

/** The deployed worker definition: skills, tools, rules, schedule, prompt.
 *  Deliberately open - this is what makes a new worker type a config change
 *  rather than a code change. */
export interface CitizenConfig {
  skills?: string[];
  tools?: string[];
  rules?: string[];
  schedule?: string;
  prompt?: string;
  [key: string]: unknown;
}

export interface Citizen {
  id: string;
  name: string;
  citizen_type: CitizenType | null;
  status: CitizenStatus;
  worker_type: WorkerType;
  business_stream: BusinessStream | null;
  config: CitizenConfig;
  is_enabled: boolean;
  revenue_lifetime: number;
  tasks_completed: number;
  tasks_failed: number;
  current_rate_limit_window: string | null;
  last_activity: string | null;
  x_position: number | null;
  y_position: number | null;
  sprite_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  name: string;
  worker_type: WorkerType;
  description: string;
  version: string;
  status: string;
  max_concurrent_tasks: number;
  avg_task_duration_seconds: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  citizen_id: string;
  worker_id: string | null;
  task_type: TaskType;
  status: TaskStatus;
  /** Integer 1-10, matching the DB CHECK. Use priorityLabel() to display. */
  priority: number;
  payload: Record<string, unknown>;
  estimated_duration_seconds: number | null;
  actual_duration_seconds: number | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  name: string;
  asset_type: 'sprite' | 'tileset' | 'ui' | 'effect';
  file_url: string;
  file_size: number;
  metadata: Record<string, unknown>;
  cache_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Revenue {
  id: string;
  citizen_id: string;
  worker_id: string | null;
  task_id: string | null;
  task_type: TaskType;
  amount: number;
  currency: string;
  source: string;
  recorded_at: string;
  created_at: string;
}

export interface RateLimit {
  id: string;
  citizen_id: string;
  task_type: TaskType;
  tier: 'free' | 'premium' | 'enterprise';
  hourly_quota: number;
  daily_quota: number;
  hourly_used: number;
  daily_used: number;
  hourly_reset_at: string;
  daily_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerHealth {
  id: string;
  worker_id: string;
  status: WorkerHealthStatus;
  uptime_percentage: number;
  last_check_at: string;
  error_count_24h: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Service Request/Response Types
// ============================================================================

export interface CreateCitizenInput {
  name: string;
  citizen_type: CitizenType;
  worker_type: WorkerType;
}

export interface QueueTaskInput {
  citizen_id: string;
  worker_id?: string | null;
  task_type: TaskType;
  /** 1-10. Omit for the default (5). */
  priority?: number;
  payload?: Record<string, unknown>;
  estimated_duration_seconds?: number;
}

export interface UpdateTaskStatusInput {
  task_id: string;
  status: TaskStatus;
  actual_duration_seconds?: number;
  output_data?: Record<string, unknown>;
  error_message?: string;
}

export interface RecordRevenueInput {
  citizen_id: string;
  worker_id?: string | null;
  task_id?: string | null;
  task_type: TaskType;
  amount: number;
  currency?: string;
  source?: string;
}

export interface RateLimitCheckInput {
  citizen_id: string;
  task_type: TaskType;
  quantity?: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  hourly_remaining: number;
  daily_remaining: number;
  resets_at: string;
  reason?: string;
}

// ============================================================================
// Service Error Types
// ============================================================================

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class DelphiTownError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'DelphiTownError';
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// Aggregation Types
// ============================================================================

export interface RevenueAggregation {
  citizen_id?: string;
  task_type?: TaskType;
  date?: string;
  total_amount: number;
  transaction_count: number;
  average_transaction: number;
}

export interface TaskMetrics {
  total_queued: number;
  total_running: number;
  total_completed: number;
  total_failed: number;
  success_rate: number;
  avg_duration_seconds: number;
}

export interface CitizenMetrics {
  total_citizens: number;
  active_citizens: number;
  total_revenue: number;
  avg_revenue_per_citizen: number;
  total_tasks_completed: number;
}

export type CostType =
  | 'api'
  | 'cogs'
  | 'subscription'
  | 'platform_fee'
  | 'shipping'
  | 'other';

export interface Cost {
  id: string;
  citizen_id: string | null;
  task_id: string | null;
  cost_type: CostType;
  amount: number;
  currency: string;
  description: string | null;
  is_recurring: boolean;
  incurred_at: string;
  created_at: string;
}

export interface RecordCostInput {
  citizen_id?: string | null;
  task_id?: string | null;
  cost_type: CostType;
  amount: number;
  currency?: string;
  description?: string;
  is_recurring?: boolean;
}

/** Returned by the get_pnl_summary() RPC. Revenue AND costs, so the dashboard
 *  can show profit rather than pretending costs are zero. */
export interface RevenueStats {
  total_revenue: number;
  total_costs: number;
  net_revenue: number;
  profit_margin_pct: number;
  total_transactions: number;
  average_transaction: number;
  average_daily: number;
  unique_citizens: number;
  active_days: number;
}

/** Per-business-stream profit and loss, from the get_pnl_by_stream() RPC.
 *  Replaces the old `breakdown_by_source` idea: that only broke down income,
 *  which cannot tell you which venture is actually worth your time. */
export interface StreamPnL {
  business_stream: string;
  total_revenue: number;
  total_costs: number;
  net_revenue: number;
  profit_margin_pct: number;
  transaction_count: number;
  citizen_count: number;
}

export interface WorkerStats {
  active_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  success_rate: number;
  avg_task_duration: number;
}
