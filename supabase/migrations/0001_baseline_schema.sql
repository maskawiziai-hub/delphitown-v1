-- =============================================================================
-- DelphiTown — Baseline Schema Snapshot
-- =============================================================================
-- Captured:   2026-09-14 from the LIVE database
-- Project:    puyfslabsrfuforapoug ("delphitown", us-west-2, PostgreSQL 17.6)
-- Purpose:    This database had ZERO migration history. The schema existed in
--             exactly one place, applied by hand through the SQL editor, with
--             no backup and no rollback path. This file is that backup.
--
-- Destination: commit to the repo as supabase/migrations/0001_baseline_schema.sql
--              Every schema change from this point forward goes through a new
--              numbered migration file — never the SQL editor.
--
-- Reconstructed from pg_catalog (columns, defaults, constraints, indexes).
-- Matviews and functions are listed at the end as names only; export their
-- definitions with `supabase db dump` before relying on this as a full restore.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE workers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  name text NOT NULL,
  worker_type text NOT NULL,
  description text,
  version text DEFAULT '1.0.0'::text NOT NULL,
  status text DEFAULT 'healthy'::text NOT NULL,
  max_concurrent_tasks integer DEFAULT 5,
  avg_task_duration_seconds integer,
  success_rate numeric(5,2) DEFAULT 0,
  capabilities jsonb DEFAULT '{}'::jsonb,
  health_check_interval_ms integer DEFAULT 60000,
  is_primary boolean DEFAULT false,
  region text DEFAULT 'us-west-2'::text
);

CREATE TABLE worker_health (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  worker_id uuid NOT NULL,
  last_heartbeat_at timestamp without time zone,
  consecutive_failures integer DEFAULT 0,
  last_error_type text,
  last_error_message text,
  health_status text DEFAULT 'healthy'::text,
  uptime_percentage numeric(5,2) DEFAULT 100,
  error_count_24h integer DEFAULT 0,
  alert_sent_at timestamp without time zone
);

CREATE TABLE worker_capabilities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  worker_id uuid NOT NULL,
  task_type text NOT NULL,
  min_version text,
  is_supported boolean DEFAULT true,
  timeout_override_ms integer,
  success_rate_pct numeric(5,2)
);

CREATE TABLE citizens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  name text NOT NULL,
  citizen_type text NOT NULL,
  status text DEFAULT 'ACTIVE'::text NOT NULL,
  worker_type text NOT NULL,
  revenue_lifetime numeric(15,2) DEFAULT 0 NOT NULL,
  tasks_completed integer DEFAULT 0,
  tasks_failed integer DEFAULT 0,
  current_rate_limit_window text,
  last_activity timestamp without time zone,
  auto_task_creation boolean DEFAULT false,
  performance_tier text DEFAULT 'free'::text,
  tags text[] DEFAULT ARRAY[]::text[]
);

CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  citizen_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  task_type text NOT NULL,
  status text DEFAULT 'QUEUED'::text NOT NULL,
  priority integer DEFAULT 5,
  estimated_duration_seconds integer,
  actual_duration_seconds integer,
  output_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  queued_at timestamp without time zone DEFAULT now() NOT NULL,
  started_at timestamp without time zone,
  completed_at timestamp without time zone,
  claimed_at timestamp without time zone,
  worker_attempt_count integer DEFAULT 0,
  last_worker_id uuid,
  estimated_cost numeric(10,2)
);

CREATE TABLE task_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  task_id uuid NOT NULL,
  event_type text NOT NULL,
  worker_id uuid,
  previous_status text,
  new_status text,
  event_data jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE revenue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  citizen_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  task_type text NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'USD'::text,
  source text DEFAULT 'task_completion'::text,
  recorded_at timestamp without time zone DEFAULT now() NOT NULL,
  task_duration_ms integer,
  profit_margin_pct numeric(5,2)
);

CREATE TABLE rate_limits (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  citizen_id uuid NOT NULL,
  task_type text NOT NULL,
  tier text DEFAULT 'free'::text NOT NULL,
  hourly_quota integer NOT NULL,
  daily_quota integer NOT NULL,
  hourly_used integer DEFAULT 0,
  daily_used integer DEFAULT 0,
  hourly_reset_at timestamp without time zone NOT NULL,
  daily_reset_at timestamp without time zone NOT NULL
);

CREATE TABLE rate_limit_quotas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  citizen_id uuid NOT NULL,
  task_type text NOT NULL,
  max_per_hour integer NOT NULL,
  max_per_day integer NOT NULL,
  used_this_hour integer DEFAULT 0,
  used_today integer DEFAULT 0,
  reset_hour_at timestamp without time zone NOT NULL,
  reset_day_at timestamp without time zone NOT NULL
);

CREATE TABLE assets_manifest (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  asset_key text NOT NULL,
  asset_name text NOT NULL,
  asset_type text NOT NULL,
  category text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes integer NOT NULL,
  file_hash text,
  width integer,
  height integer,
  frame_count integer,
  duration_ms integer,
  tags text[] DEFAULT ARRAY[]::text[],
  source text DEFAULT 'custom'::text,
  source_url text,
  version text DEFAULT '1.0.0'::text,
  is_deprecated boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE feature_flags (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  flag_name text NOT NULL,
  is_enabled boolean DEFAULT false,
  description text,
  rollout_percentage integer DEFAULT 0,
  enabled_for_workers text[] DEFAULT ARRAY[]::text[]
);

-- -----------------------------------------------------------------------------
-- PRIMARY KEYS
-- -----------------------------------------------------------------------------

ALTER TABLE assets_manifest    ADD CONSTRAINT assets_manifest_pkey    PRIMARY KEY (id);
ALTER TABLE citizens           ADD CONSTRAINT citizens_pkey           PRIMARY KEY (id);
ALTER TABLE feature_flags      ADD CONSTRAINT feature_flags_pkey      PRIMARY KEY (id);
ALTER TABLE rate_limit_quotas  ADD CONSTRAINT rate_limit_quotas_pkey  PRIMARY KEY (id);
ALTER TABLE rate_limits        ADD CONSTRAINT rate_limits_pkey        PRIMARY KEY (id);
ALTER TABLE revenue            ADD CONSTRAINT revenue_pkey            PRIMARY KEY (id);
ALTER TABLE task_events        ADD CONSTRAINT task_events_pkey        PRIMARY KEY (id);
ALTER TABLE tasks              ADD CONSTRAINT tasks_pkey              PRIMARY KEY (id);
ALTER TABLE worker_capabilities ADD CONSTRAINT worker_capabilities_pkey PRIMARY KEY (id);
ALTER TABLE worker_health      ADD CONSTRAINT worker_health_pkey      PRIMARY KEY (id);
ALTER TABLE workers            ADD CONSTRAINT workers_pkey            PRIMARY KEY (id);

-- -----------------------------------------------------------------------------
-- UNIQUE CONSTRAINTS
-- -----------------------------------------------------------------------------

ALTER TABLE assets_manifest    ADD CONSTRAINT assets_manifest_asset_key_key UNIQUE (asset_key);
ALTER TABLE feature_flags      ADD CONSTRAINT feature_flags_flag_name_key   UNIQUE (flag_name);
ALTER TABLE rate_limit_quotas  ADD CONSTRAINT rate_limit_quotas_citizen_id_task_type_key UNIQUE (citizen_id, task_type);
ALTER TABLE worker_capabilities ADD CONSTRAINT worker_capabilities_worker_id_task_type_key UNIQUE (worker_id, task_type);

-- ⚠️ REVIEW: one rate-limit row per citizen TOTAL, despite the table carrying a
--    task_type column. Contradicts rate_limit_quotas' UNIQUE(citizen_id, task_type).
ALTER TABLE rate_limits        ADD CONSTRAINT rate_limits_citizen_id_key    UNIQUE (citizen_id);

-- ⚠️ REVIEW: SCHEMA_REVIEW_AND_CORRECTIONS.md called for REMOVING this so the
--    table could store heartbeat history. It was never removed, so worker_health
--    holds exactly one row per worker and no history is possible.
ALTER TABLE worker_health      ADD CONSTRAINT worker_health_worker_id_key   UNIQUE (worker_id);

-- -----------------------------------------------------------------------------
-- FOREIGN KEYS
-- -----------------------------------------------------------------------------

ALTER TABLE rate_limits         ADD CONSTRAINT rate_limits_citizen_id_fkey         FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE;
ALTER TABLE revenue             ADD CONSTRAINT revenue_citizen_id_fkey             FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE;
ALTER TABLE revenue             ADD CONSTRAINT revenue_worker_id_fkey              FOREIGN KEY (worker_id)  REFERENCES workers(id)  ON DELETE RESTRICT;
ALTER TABLE task_events         ADD CONSTRAINT task_events_task_id_fkey            FOREIGN KEY (task_id)    REFERENCES tasks(id)    ON DELETE CASCADE;
ALTER TABLE task_events         ADD CONSTRAINT task_events_worker_id_fkey          FOREIGN KEY (worker_id)  REFERENCES workers(id)  ON DELETE SET NULL;
ALTER TABLE tasks               ADD CONSTRAINT tasks_citizen_id_fkey               FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE;
ALTER TABLE tasks               ADD CONSTRAINT tasks_worker_id_fkey                FOREIGN KEY (worker_id)  REFERENCES workers(id)  ON DELETE RESTRICT;
ALTER TABLE tasks               ADD CONSTRAINT tasks_last_worker_id_fkey           FOREIGN KEY (last_worker_id) REFERENCES workers(id) ON DELETE SET NULL;
ALTER TABLE worker_capabilities ADD CONSTRAINT worker_capabilities_worker_id_fkey  FOREIGN KEY (worker_id)  REFERENCES workers(id)  ON DELETE CASCADE;
ALTER TABLE worker_health       ADD CONSTRAINT worker_health_worker_id_fkey        FOREIGN KEY (worker_id)  REFERENCES workers(id)  ON DELETE CASCADE;

-- Note: rate_limit_quotas.citizen_id has NO foreign key. Likely an oversight.

-- -----------------------------------------------------------------------------
-- CHECK CONSTRAINTS  (these are the real enums — no PG enum types are defined)
-- -----------------------------------------------------------------------------

-- ⚠️ CRITICAL: citizen_type is human/bot/hybrid — it matches NEITHER the
--    WorkerType vocabulary (pricing_agent, video_analyzer, …) NOR the persona
--    vocabulary (gta6_trader, osrs_flipper, …) used in the specs and in
--    architecture.ts. The job a citizen does lives in the SEPARATE worker_type
--    column. Any code doing WORKER_TYPE_CONFIG[citizen.citizen_type] is broken.
ALTER TABLE citizens ADD CONSTRAINT citizens_citizen_type_check CHECK (citizen_type = ANY (ARRAY['human','bot','hybrid']));

-- ⚠️ Note 'ACTIVE', not 'WORKING'. The widget tests assert on 'WORKING',
--    which this constraint would reject.
ALTER TABLE citizens ADD CONSTRAINT citizens_status_check CHECK (status = ANY (ARRAY['ACTIVE','IDLE','RESTING','OFFLINE','BANNED']));
ALTER TABLE citizens ADD CONSTRAINT valid_name CHECK (length(name) > 0);

ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status = ANY (ARRAY['QUEUED','RUNNING','COMPLETED','FAILED','STUCK','RETRYING','CANCELLED','TIMEOUT']));
-- ⚠️ priority is an INTEGER 1–10. The Worker API spec and the UI both use
--    'HIGH'/'MEDIUM'/'LOW' strings. No mapping is defined anywhere.
ALTER TABLE tasks ADD CONSTRAINT valid_priority    CHECK (priority >= 1 AND priority <= 10);
ALTER TABLE tasks ADD CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries);

ALTER TABLE task_events ADD CONSTRAINT task_events_event_type_check CHECK (event_type = ANY (ARRAY['created','claimed','started','completed','failed','retried','stuck','timeout','cancelled']));

ALTER TABLE revenue ADD CONSTRAINT amount_positive CHECK (amount > (0)::numeric);

ALTER TABLE rate_limits ADD CONSTRAINT rate_limits_tier_check CHECK (tier = ANY (ARRAY['free','premium','enterprise']));
ALTER TABLE rate_limits ADD CONSTRAINT valid_quotas CHECK (hourly_used <= hourly_quota AND daily_used <= daily_quota);

ALTER TABLE worker_health ADD CONSTRAINT worker_health_health_status_check CHECK (health_status = ANY (ARRAY['healthy','degraded','offline','error']));

ALTER TABLE workers ADD CONSTRAINT valid_name    CHECK (length(name) > 0);
ALTER TABLE workers ADD CONSTRAINT valid_version CHECK (length(version) > 0);
-- Note: workers.status has NO check constraint and defaults to 'healthy',
-- which is a health value rather than a work state (idle/working/paused).

ALTER TABLE assets_manifest ADD CONSTRAINT assets_manifest_asset_type_check CHECK (asset_type = ANY (ARRAY['sprite','animation','audio','icon','emoji','tileset','particle']));
ALTER TABLE assets_manifest ADD CONSTRAINT assets_manifest_category_check   CHECK (category   = ANY (ARRAY['citizen','ui','sfx','music','tileset','particle','background']));
ALTER TABLE assets_manifest ADD CONSTRAINT assets_manifest_source_check     CHECK (source     = ANY (ARRAY['downloaded','generated','purchased','custom']));

ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_rollout_percentage_check CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100);

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_assets_category    ON public.assets_manifest USING btree (category);
CREATE INDEX idx_assets_deprecated  ON public.assets_manifest USING btree (is_deprecated);
CREATE INDEX idx_assets_type        ON public.assets_manifest USING btree (asset_type);
CREATE INDEX idx_citizens_created_at ON public.citizens USING btree (created_at DESC);
CREATE INDEX idx_citizens_status     ON public.citizens USING btree (status);
CREATE INDEX idx_citizens_worker_type ON public.citizens USING btree (worker_type);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags USING btree (is_enabled);
CREATE INDEX idx_feature_flags_name    ON public.feature_flags USING btree (flag_name);
CREATE INDEX idx_quota_citizen       ON public.rate_limit_quotas USING btree (citizen_id);
CREATE INDEX idx_quota_type          ON public.rate_limit_quotas USING btree (task_type);
CREATE INDEX idx_rate_limits_citizen_id ON public.rate_limits USING btree (citizen_id);
CREATE INDEX idx_rate_limits_reset_at   ON public.rate_limits USING btree (hourly_reset_at, daily_reset_at);
CREATE INDEX idx_rate_limits_tier       ON public.rate_limits USING btree (tier);
CREATE INDEX idx_revenue_citizen_id  ON public.revenue USING btree (citizen_id);
CREATE INDEX idx_revenue_created_at  ON public.revenue USING btree (created_at DESC);
CREATE INDEX idx_revenue_recorded_at ON public.revenue USING btree (recorded_at DESC);
CREATE INDEX idx_revenue_task_type   ON public.revenue USING btree (task_type);
CREATE INDEX idx_revenue_worker_id   ON public.revenue USING btree (worker_id);
CREATE INDEX idx_task_events_created_at ON public.task_events USING btree (created_at DESC);
CREATE INDEX idx_task_events_event_type ON public.task_events USING btree (event_type);
CREATE INDEX idx_task_events_task_id    ON public.task_events USING btree (task_id);
CREATE INDEX idx_tasks_citizen_id     ON public.tasks USING btree (citizen_id);
CREATE INDEX idx_tasks_citizen_status ON public.tasks USING btree (citizen_id, status);
CREATE INDEX idx_tasks_created_at     ON public.tasks USING btree (created_at DESC);
CREATE INDEX idx_tasks_queued_at      ON public.tasks USING btree (queued_at DESC);
CREATE INDEX idx_tasks_status         ON public.tasks USING btree (status);
CREATE INDEX idx_tasks_worker_id      ON public.tasks USING btree (worker_id);
CREATE INDEX idx_worker_capabilities_task_type ON public.worker_capabilities USING btree (task_type);
CREATE INDEX idx_worker_capabilities_worker_id ON public.worker_capabilities USING btree (worker_id);
CREATE INDEX idx_worker_health_status     ON public.worker_health USING btree (health_status);
CREATE INDEX idx_worker_health_updated_at ON public.worker_health USING btree (updated_at DESC);
CREATE INDEX idx_workers_is_primary ON public.workers USING btree (is_primary);
CREATE INDEX idx_workers_status     ON public.workers USING btree (status);
CREATE INDEX idx_workers_type       ON public.workers USING btree (worker_type);

-- Indexes on the materialized views (recreate after the matviews below):
-- CREATE INDEX idx_citizen_performance_citizen_id ON public.citizen_performance USING btree (id);
-- CREATE INDEX idx_worker_dashboard_worker_id     ON public.worker_dashboard     USING btree (id);

-- -----------------------------------------------------------------------------
-- MATERIALIZED VIEWS — deployed, definitions NOT captured here
-- -----------------------------------------------------------------------------
--   worker_dashboard
--   citizen_performance
-- Export with: supabase db dump --schema public > full_dump.sql
--
-- NOT deployed but queried by src/services/revenueService.ts (these calls fail):
--   revenue_by_citizen
--   revenue_by_task_type

-- -----------------------------------------------------------------------------
-- FUNCTIONS — deployed, definitions NOT captured here
-- -----------------------------------------------------------------------------
--   auto_retry_stuck_tasks()
--   update_worker_health()
--   cleanup_old_events()
-- None are currently called by any application code.

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY — CURRENT STATE IS UNSAFE
-- -----------------------------------------------------------------------------
-- RLS enabled:  citizens, tasks, revenue, rate_limits
-- RLS DISABLED: workers, worker_health, worker_capabilities, task_events,
--               rate_limit_quotas, assets_manifest, feature_flags
--
-- Those seven tables are fully readable and writable by anyone holding the anon
-- key — which ships in the browser bundle. Close this before any deployment.
--
-- DO NOT simply run the ALTER statements below. Enabling RLS without policies
-- blocks all access, including the app's. Write policies FIRST, then enable:
--
--   ALTER TABLE public.workers             ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.worker_health       ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.worker_capabilities ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.task_events         ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.rate_limit_quotas   ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.assets_manifest     ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.feature_flags       ENABLE ROW LEVEL SECURITY;
--
-- Also confirm the four already-enabled tables actually have policies — RLS on
-- with no policies silently denies everything.

-- -----------------------------------------------------------------------------
-- DESIGN ISSUES FOUND IN THE DEPLOYED SCHEMA (fix via new migrations)
-- -----------------------------------------------------------------------------
-- 1. tasks.worker_id is NOT NULL. A task cannot be queued without a worker
--    already assigned, which contradicts the entire claim-from-queue model in
--    WORKER_API_SPECIFICATION.md. Should be nullable until claimed.
-- 2. tasks has NO payload/input column. DynamicTaskForm builds a JSON-Schema
--    validated payload with nowhere to store it. output_data holds results only.
-- 3. revenue has NO task_id. Revenue cannot be traced back to the task that
--    earned it, and revenue.worker_id is NOT NULL so manual entries are blocked.
-- 4. rate_limits and rate_limit_quotas are two competing implementations of the
--    same concept, with incompatible uniqueness rules. Keep one.
-- 5. citizens has no x_position / y_position / sprite_key — the pixel-art town
--    has nowhere to store where anything is. Needed before TownGrid can render.
-- 6. citizens has no business_stream column despite it being central to the
--    revenue model.
-- 7. No worker auth storage anywhere (no auth_token / worker_tokens table), so
--    the Worker API has no way to authenticate a worker.
-- 8. worker_health.worker_id UNIQUE prevents the heartbeat history the health
--    monitoring design depends on.
