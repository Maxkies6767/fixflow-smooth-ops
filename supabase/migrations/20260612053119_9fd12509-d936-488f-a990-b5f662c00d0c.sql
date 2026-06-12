
-- Tighten search_path on trigger fn
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Restrict execute on security-definer helpers to roles that actually need them.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
-- has_role still needs authenticated execute so RLS policies that call it pass
-- when evaluated under the calling user's role.

-- Tighten repairs write policies — require authenticated user instead of plain true.
DROP POLICY IF EXISTS "repairs_insert_authenticated" ON public.repairs;
DROP POLICY IF EXISTS "repairs_update_authenticated" ON public.repairs;
CREATE POLICY "repairs_insert_authenticated"
  ON public.repairs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "repairs_update_authenticated"
  ON public.repairs FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Tighten profiles policies similarly
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
