
-- =====================================================
-- S-OMS v1.0 DATABASE SCHEMA
-- =====================================================

-- ENUMS
CREATE TYPE public.org_type AS ENUM ('security_agency', 'internal_security');
CREATE TYPE public.member_role AS ENUM ('super_admin', 'org_admin', 'dispatcher', 'chief', 'director', 'guard', 'client');
CREATE TYPE public.post_type AS ENUM ('static', 'checkpoint', 'mobile', 'kpp');
CREATE TYPE public.incident_type AS ENUM ('alarm', 'violation', 'event', 'fraud');
CREATE TYPE public.incident_status AS ENUM ('created', 'accepted', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.shift_status AS ENUM ('scheduled', 'active', 'completed', 'missed');
CREATE TYPE public.patrol_run_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.acceptance_action AS ENUM ('accept', 'handover');
CREATE TYPE public.patrol_method AS ENUM ('gps', 'qr', 'nfc', 'manual');

-- =====================================================
-- 1) ORGANIZATIONS
-- =====================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.org_type NOT NULL DEFAULT 'security_agency',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2) ORG_MEMBERS (maps auth.users to organizations with roles)
-- =====================================================
CREATE TABLE public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'guard',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3) COUNTERPARTIES
-- =====================================================
CREATE TABLE public.counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contract_no TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4) OBJECTS
-- =====================================================
CREATE TABLE public.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  counterparty_id UUID REFERENCES public.counterparties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  risk_level public.risk_level NOT NULL DEFAULT 'low',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5) OBJECT_CLIENTS (client access mapping)
-- =====================================================
CREATE TABLE public.object_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (object_id, user_id)
);
ALTER TABLE public.object_clients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6) POSTS
-- =====================================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  object_id UUID NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.post_type NOT NULL DEFAULT 'static',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7) PERSONNEL
-- =====================================================
CREATE TABLE public.personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8) SHIFTS
-- =====================================================
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  planned_start TIMESTAMPTZ NOT NULL,
  planned_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status public.shift_status NOT NULL DEFAULT 'scheduled',
  start_lat DOUBLE PRECISION,
  start_lon DOUBLE PRECISION,
  end_lat DOUBLE PRECISION,
  end_lon DOUBLE PRECISION,
  violations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9) PATROL_ROUTES
-- =====================================================
CREATE TABLE public.patrol_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  object_id UUID NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patrol_routes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10) PATROL_CHECKPOINTS
-- =====================================================
CREATE TABLE public.patrol_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.patrol_routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expected_order INTEGER NOT NULL DEFAULT 0,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patrol_checkpoints ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11) PATROL_RUNS
-- =====================================================
CREATE TABLE public.patrol_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.patrol_routes(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status public.patrol_run_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patrol_runs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12) PATROL_EVENTS
-- =====================================================
CREATE TABLE public.patrol_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.patrol_runs(id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES public.patrol_checkpoints(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  method public.patrol_method NOT NULL DEFAULT 'manual',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patrol_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 13) INCIDENTS
-- =====================================================
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  object_id UUID REFERENCES public.objects(id) ON DELETE SET NULL,
  created_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type public.incident_type NOT NULL DEFAULT 'event',
  severity public.risk_level NOT NULL DEFAULT 'low',
  status public.incident_status NOT NULL DEFAULT 'created',
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 14) RESPONSES
-- =====================================================
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  assigned_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 15) OBJECT_ACCEPTANCE
-- =====================================================
CREATE TABLE public.object_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
  action public.acceptance_action NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.object_acceptance ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 16) AUDIT_LOG (immutable)
-- =====================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECURITY DEFINER FUNCTION for role checks
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.member_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = _user_id AND role = _role AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.org_members
  WHERE user_id = _user_id AND is_active = true
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Organizations: members can read their orgs
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Org members: users see members of their orgs
CREATE POLICY "Members can view org members"
  ON public.org_members FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Counterparties: org-scoped read
CREATE POLICY "Members can view counterparties"
  ON public.counterparties FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Objects: org-scoped read + client access
CREATE POLICY "Members can view objects"
  ON public.objects FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    OR id IN (SELECT object_id FROM public.object_clients WHERE user_id = auth.uid())
  );

-- Object clients: users can see their own mappings
CREATE POLICY "Users can view own object access"
  ON public.object_clients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Posts: org-scoped read
CREATE POLICY "Members can view posts"
  ON public.posts FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Personnel: org-scoped read
CREATE POLICY "Members can view personnel"
  ON public.personnel FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Shifts: org-scoped read
CREATE POLICY "Members can view shifts"
  ON public.shifts FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Shifts: guards can update their own shifts
CREATE POLICY "Guards can update own shifts"
  ON public.shifts FOR UPDATE TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND personnel_id IN (SELECT id FROM public.personnel WHERE user_id = auth.uid())
  );

-- Patrol routes: org-scoped read
CREATE POLICY "Members can view patrol routes"
  ON public.patrol_routes FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Patrol checkpoints: via route org scope
CREATE POLICY "Members can view patrol checkpoints"
  ON public.patrol_checkpoints FOR SELECT TO authenticated
  USING (route_id IN (
    SELECT id FROM public.patrol_routes WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  ));

-- Patrol runs: org-scoped read
CREATE POLICY "Members can view patrol runs"
  ON public.patrol_runs FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Patrol events: via run org scope
CREATE POLICY "Members can view patrol events"
  ON public.patrol_events FOR SELECT TO authenticated
  USING (run_id IN (
    SELECT id FROM public.patrol_runs WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  ));

-- Incidents: org-scoped read + client object access
CREATE POLICY "Members can view incidents"
  ON public.incidents FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    OR object_id IN (SELECT object_id FROM public.object_clients WHERE user_id = auth.uid())
  );

-- Incidents: authenticated users in org can create
CREATE POLICY "Members can create incidents"
  ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Responses: via incident org scope
CREATE POLICY "Members can view responses"
  ON public.responses FOR SELECT TO authenticated
  USING (incident_id IN (
    SELECT id FROM public.incidents WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  ));

-- Object acceptance: client can view own objects
CREATE POLICY "Users can view acceptance records"
  ON public.object_acceptance FOR SELECT TO authenticated
  USING (
    object_id IN (SELECT object_id FROM public.object_clients WHERE user_id = auth.uid())
    OR object_id IN (SELECT id FROM public.objects WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid())))
  );

-- Object acceptance: clients can insert
CREATE POLICY "Clients can create acceptance records"
  ON public.object_acceptance FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Audit log: org-scoped read (immutable — no update/delete)
CREATE POLICY "Members can view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Authenticated can insert audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- =====================================================
-- ANON READ POLICIES (for demo/seed data viewing before auth)
-- =====================================================
CREATE POLICY "Anon can read organizations" ON public.organizations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read objects" ON public.objects FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read posts" ON public.posts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read personnel" ON public.personnel FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read shifts" ON public.shifts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read patrol_routes" ON public.patrol_routes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read patrol_checkpoints" ON public.patrol_checkpoints FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read patrol_runs" ON public.patrol_runs FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read incidents" ON public.incidents FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read counterparties" ON public.counterparties FOR SELECT TO anon USING (true);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_counterparties_updated_at BEFORE UPDATE ON public.counterparties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_objects_updated_at BEFORE UPDATE ON public.objects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_personnel_updated_at BEFORE UPDATE ON public.personnel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patrol_routes_updated_at BEFORE UPDATE ON public.patrol_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================
INSERT INTO public.organizations (id, name, type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Demo Security Agency', 'security_agency');

INSERT INTO public.counterparties (id, org_id, name, contract_no) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ООО «Горизонт Групп»', 'КД-2026/001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'ООО «МегаМолл»', 'КД-2026/002'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'ИП Логистов', 'КД-2026/003');

INSERT INTO public.objects (id, org_id, counterparty_id, name, address, lat, lon, risk_level) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'БЦ «Горизонт»', 'ул. Ленина, 45', 55.7558, 37.6173, 'medium'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'ТЦ «Мега Молл»', 'пр. Победы, 120', 55.7400, 37.6300, 'high'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Склад «Логистик»', 'Промзона, стр. 12', 55.7200, 37.6500, 'low'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', NULL, 'ЖК «Парковый»', 'ул. Садовая, 8', 55.7650, 37.5800, 'medium'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', NULL, 'Завод «Прогресс»', 'Промышленная, 3', 55.7100, 37.6700, 'critical');

INSERT INTO public.posts (id, org_id, object_id, name, type) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'КПП Главный', 'kpp'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Пост Холл', 'static'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Пост Вход А', 'static'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Пост Парковка', 'checkpoint'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'КПП Склад', 'kpp'),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Пост Двор', 'mobile'),
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'КПП Завод', 'kpp');

INSERT INTO public.personnel (id, org_id, full_name, position, phone) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Петров Дмитрий Алексеевич', 'Охранник', '+7-900-111-0001'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Иванов Сергей Константинович', 'Охранник', '+7-900-111-0002'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Козлов Андрей Викторович', 'Старший смены', '+7-900-111-0003'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Сидоров Максим Евгеньевич', 'Охранник', '+7-900-111-0004'),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Волков Алексей Сергеевич', 'Охранник', '+7-900-111-0005');

INSERT INTO public.shifts (id, org_id, post_id, personnel_id, planned_start, planned_end, actual_start, status, violations) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', now() - interval '2 hours', now() + interval '6 hours', now() - interval '1 hour 45 minutes', 'active', 0),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', now() - interval '3 hours', now() + interval '5 hours', now() - interval '3 hours', 'active', 1),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000003', now() - interval '1 hour', now() + interval '7 hours', now() - interval '50 minutes', 'active', 0),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', now() + interval '4 hours', now() + interval '12 hours', NULL, 'scheduled', 0),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000005', now() - interval '10 hours', now() - interval '2 hours', now() - interval '10 hours', 'completed', 2);

INSERT INTO public.patrol_routes (id, org_id, object_id, name) VALUES
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Периметр БЦ'),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Внутренний ТЦ'),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Обход складов');

INSERT INTO public.patrol_checkpoints (id, route_id, name, expected_order, lat, lon) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Вход главный', 1, 55.7558, 37.6173),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Парковка', 2, 55.7560, 37.6175),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Задний двор', 3, 55.7555, 37.6180),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Вход А', 1, 55.7400, 37.6300),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Фудкорт', 2, 55.7402, 37.6305),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Паркинг -1', 3, 55.7398, 37.6310),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'Паркинг -2', 4, 55.7396, 37.6312),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'Ворота', 1, 55.7200, 37.6500),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 'Секция А', 2, 55.7202, 37.6505),
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000003', 'Секция Б', 3, 55.7204, 37.6510);

INSERT INTO public.patrol_runs (id, org_id, route_id, shift_id, started_at, ended_at, status) VALUES
  ('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', now() - interval '1 hour', now() - interval '30 minutes', 'completed'),
  ('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', now() - interval '45 minutes', NULL, 'in_progress'),
  ('30000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', NULL, NULL, NULL, 'pending');

INSERT INTO public.incidents (id, org_id, object_id, type, severity, status, title, description, assigned_to) VALUES
  ('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'alarm', 'high', 'in_progress', 'Сработка датчика движения, зона B2', 'Срабатывание на 2 этаже, зона B2. Охранник направлен.', 'Петров Д.А.'),
  ('40000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'violation', 'critical', 'accepted', 'Несанкционированный доступ, парковка -2', 'Неизвестное ТС на закрытой парковке.', 'Иванов С.К.'),
  ('40000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'event', 'low', 'closed', 'Плановая проверка пожарной сигнализации', 'Плановое тестирование системы.', NULL),
  ('40000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'alarm', 'medium', 'created', 'Обнаружена открытая дверь, подвал', 'Дверь подвала оставлена открытой ночью.', NULL),
  ('40000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'fraud', 'high', 'resolved', 'Попытка подмены пропуска', 'Зафиксирована попытка прохода по чужому пропуску.', 'Козлов А.В.');
