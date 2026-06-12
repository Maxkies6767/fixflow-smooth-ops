
CREATE OR REPLACE FUNCTION public.purge_old_activity_logs()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  DELETE FROM public.activity_logs WHERE at < now() - interval '90 days';
$$;

REVOKE EXECUTE ON FUNCTION public.purge_old_activity_logs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_old_activity_logs() TO authenticated;
