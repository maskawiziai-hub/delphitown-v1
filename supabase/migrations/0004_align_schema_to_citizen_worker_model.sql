-- 0004_align_schema_to_citizen_worker_model
-- Applied 2026-09-14.
--
-- Aligns the schema with the actual product model: a CITIZEN *is* a deployed
-- AI worker with a standing job, custom name, skills, tools and rules.
-- It is not a task-queue worker waiting to be assigned work.
--
-- Safe to restructure: every table was empty (0 rows) at time of application.

-- 1. Remove the human/bot/hybrid classification. Citizens are deployed with
--    custom roles chosen at deploy time, not three fixed kinds.
ALTER TABLE public.citizens DROP CONSTRAINT IF EXISTS citizens_citizen_type_check;
ALTER TABLE public.citizens ALTER COLUMN citizen_type DROP NOT NULL;
COMMENT ON COLUMN public.citizens.citizen_type IS
  'Optional display archetype chosen at deploy time (e.g. "Market Stall", "Scholar"). Free text - no fixed vocabulary.';

-- 2. The citizen IS the worker: give it the config that defines its standing job.
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.citizens.config IS
  'The deployed worker definition: skills, tools, rules, schedule, prompt, credentials ref. Set at deploy time.';
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS business_stream text;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT true;

-- 3. Town placement - the pixel-art view had nowhere to store position.
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS x_position integer;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS y_position integer;
ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS sprite_key text;

-- 4. Tasks: a task is a RUN of a citizen's standing job.
--    worker_id was NOT NULL, which made a run impossible to record without a
--    separate worker row. citizen_id already identifies who ran it.
ALTER TABLE public.tasks ALTER COLUMN worker_id DROP NOT NULL;
--    There was no input column at all, so the dynamic form had nowhere to write.
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.tasks.payload IS
  'Run input, validated against the task type JSON Schema. Results go in output_data.';

-- 5. Revenue must trace back to the run that earned it.
ALTER TABLE public.revenue ALTER COLUMN worker_id DROP NOT NULL;
ALTER TABLE public.revenue ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_revenue_task_id ON public.revenue(task_id);

-- 6. rate_limit_quotas.citizen_id had no foreign key.
ALTER TABLE public.rate_limit_quotas
  ADD CONSTRAINT rate_limit_quotas_citizen_id_fkey
  FOREIGN KEY (citizen_id) REFERENCES public.citizens(id) ON DELETE CASCADE;

-- 7. worker_health.worker_id UNIQUE prevented heartbeat history from accumulating.
--    SCHEMA_REVIEW_AND_CORRECTIONS.md called for this removal; it was never applied.
ALTER TABLE public.worker_health DROP CONSTRAINT IF EXISTS worker_health_worker_id_key;

-- 8. The Charter lives in the database, not in a Drive file that drifts.
CREATE TABLE IF NOT EXISTS public.worker_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  rule_number integer NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  is_binding boolean NOT NULL DEFAULT true,
  applies_to text NOT NULL DEFAULT 'all',
  added_on date NOT NULL DEFAULT current_date,
  retired_on date,
  UNIQUE (rule_number)
);
ALTER TABLE public.worker_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON public.worker_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
COMMENT ON TABLE public.worker_rules IS
  'The Worker Charter, versioned in the database. The deploy function enforces these against every citizen.';
