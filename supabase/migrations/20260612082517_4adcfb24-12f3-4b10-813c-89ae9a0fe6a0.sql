
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_name text NOT NULL DEFAULT 'system',
  level text NOT NULL,
  category text NOT NULL,
  message text NOT NULL,
  ref_id text
);

CREATE INDEX activity_logs_at_idx ON public.activity_logs (at DESC);
CREATE INDEX activity_logs_category_idx ON public.activity_logs (category);
CREATE INDEX activity_logs_level_idx ON public.activity_logs (level);

GRANT SELECT, INSERT, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_insert_authenticated"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "activity_logs_select_owner"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::public.app_role));

CREATE POLICY "activity_logs_delete_owner"
  ON public.activity_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::public.app_role));

CREATE OR REPLACE FUNCTION public.purge_old_activity_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.activity_logs WHERE at < now() - interval '90 days';
$$;

GRANT EXECUTE ON FUNCTION public.purge_old_activity_logs() TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
