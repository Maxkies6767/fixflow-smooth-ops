
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('owner', 'technician');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all_authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "user_roles_select_authenticated"
  ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_owner_manage"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- ============ NEW USER TRIGGER ============
-- First user becomes owner; subsequent users become technicians.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  assigned_role := CASE WHEN user_count = 0 THEN 'owner'::public.app_role ELSE 'technician'::public.app_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ REPAIRS ============
CREATE TABLE public.repairs (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  tracking_code TEXT GENERATED ALWAYS AS (lower(data->>'trackingCode')) STORED,
  status TEXT GENERATED ALWAYS AS (data->>'status') STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT, UPDATE ON public.repairs TO authenticated;
GRANT ALL ON public.repairs TO service_role;
CREATE INDEX repairs_tracking_code_idx ON public.repairs (tracking_code) WHERE tracking_code IS NOT NULL;
CREATE INDEX repairs_status_idx ON public.repairs (status);

ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "repairs_select_authenticated"
  ON public.repairs FOR SELECT TO authenticated USING (true);
CREATE POLICY "repairs_insert_authenticated"
  ON public.repairs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "repairs_update_authenticated"
  ON public.repairs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "repairs_delete_owner"
  ON public.repairs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER repairs_touch_updated_at
  BEFORE UPDATE ON public.repairs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PUBLIC TRACKING RPC ============
-- Anonymous customers can look up their repair by tracking code only.
CREATE OR REPLACE FUNCTION public.get_repair_by_tracking_code(_code TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT data FROM public.repairs
  WHERE tracking_code = lower(_code)
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_repair_by_tracking_code(TEXT) TO anon, authenticated;

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.repairs;
ALTER TABLE public.repairs REPLICA IDENTITY FULL;
