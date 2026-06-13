
-- Profiles: restrict SELECT to self or owner
DROP POLICY IF EXISTS profiles_select_all_authenticated ON public.profiles;
CREATE POLICY profiles_select_self_or_owner ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'owner'::public.app_role));

-- User roles: restrict SELECT to self or owner
DROP POLICY IF EXISTS user_roles_select_authenticated ON public.user_roles;
CREATE POLICY user_roles_select_self_or_owner ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'::public.app_role));

-- Repairs: restrict UPDATE to creator or owner
DROP POLICY IF EXISTS repairs_update_authenticated ON public.repairs;
CREATE POLICY repairs_update_creator_or_owner ON public.repairs
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'owner'::public.app_role))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'owner'::public.app_role));
