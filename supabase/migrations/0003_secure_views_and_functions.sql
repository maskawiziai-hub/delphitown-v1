-- 0003_secure_views_and_functions
-- Applied 2026-09-14.
--
-- Materialized views bypass table RLS entirely. Both of these aggregate
-- business data (worker performance, citizen revenue) and were readable by
-- anon even after 0002 locked the underlying tables.
--
-- Functions without a pinned search_path can be hijacked by a caller that
-- places a malicious schema earlier in their search path.

REVOKE ALL ON public.worker_dashboard    FROM anon;
REVOKE ALL ON public.citizen_performance FROM anon;
GRANT SELECT ON public.worker_dashboard    TO authenticated;
GRANT SELECT ON public.citizen_performance TO authenticated;

ALTER FUNCTION public.auto_retry_stuck_tasks()    SET search_path = public, pg_temp;
ALTER FUNCTION public.update_worker_health()      SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_old_events(integer) SET search_path = public, pg_temp;
