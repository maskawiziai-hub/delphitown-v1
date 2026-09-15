-- 0002_rls_lockdown
-- Applied 2026-09-14. Closes the anon-key exposure across all tables.
--
-- Before: 7 tables had RLS off entirely (anon could read AND write).
--         4 tables had RLS on but a "public read" policy (anon could read
--         citizens, tasks, revenue and rate_limits — i.e. all business data).
-- After:  anon can read only feature_flags + assets_manifest (needed to boot
--         the UI, no business data). Everything else requires a signed-in session.
--
-- NOTE: this is why the app must add authentication (Phase 1.0). With the anon
-- key and no sign-in, the app can no longer read workers/citizens/tasks, so
-- checkSupabaseHealth() returns false. That is correct, not a regression.

-- 1. Remove the public-read policies that exposed business data to anon.
DROP POLICY IF EXISTS "Allow public read" ON public.citizens;
DROP POLICY IF EXISTS "Allow public read" ON public.tasks;
DROP POLICY IF EXISTS "Allow public read" ON public.revenue;
DROP POLICY IF EXISTS "Allow public read" ON public.rate_limits;

-- 2. Enable RLS on the seven tables that had none.
ALTER TABLE public.workers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_health       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_quotas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets_manifest     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags       ENABLE ROW LEVEL SECURITY;

-- 3. Full access for signed-in operators on every table.
CREATE POLICY "authenticated_all" ON public.workers             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.worker_health       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.worker_capabilities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.citizens            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.tasks               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.task_events         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.revenue             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.rate_limits         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.rate_limit_quotas   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.assets_manifest     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.feature_flags       FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Anon may read ONLY the two non-sensitive tables the UI needs before sign-in.
CREATE POLICY "anon_read_assets" ON public.assets_manifest FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_flags"  ON public.feature_flags   FOR SELECT TO anon USING (true);
