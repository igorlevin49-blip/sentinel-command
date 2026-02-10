
-- =====================================================
-- S-OMS STRICT RLS — DROP ALL EXISTING POLICIES
-- =====================================================

-- audit_log
DROP POLICY IF EXISTS "Authenticated can insert own audit log" ON public.audit_log;
DROP POLICY IF EXISTS "Members can view audit log" ON public.audit_log;

-- counterparties
DROP POLICY IF EXISTS "Anon can read counterparties" ON public.counterparties;
DROP POLICY IF EXISTS "Members can view counterparties" ON public.counterparties;

-- incidents
DROP POLICY IF EXISTS "Anon can read incidents" ON public.incidents;
DROP POLICY IF EXISTS "Members can create incidents" ON public.incidents;
DROP POLICY IF EXISTS "Members can view incidents" ON public.incidents;

-- object_acceptance
DROP POLICY IF EXISTS "Clients can create acceptance records" ON public.object_acceptance;
DROP POLICY IF EXISTS "Users can view acceptance records" ON public.object_acceptance;

-- object_clients
DROP POLICY IF EXISTS "Users can view own object access" ON public.object_clients;

-- objects
DROP POLICY IF EXISTS "Anon can read objects" ON public.objects;
DROP POLICY IF EXISTS "Members can view objects" ON public.objects;

-- org_members
DROP POLICY IF EXISTS "Members can view org members" ON public.org_members;

-- organizations
DROP POLICY IF EXISTS "Anon can read organizations" ON public.organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- patrol_checkpoints
DROP POLICY IF EXISTS "Anon can read patrol_checkpoints" ON public.patrol_checkpoints;
DROP POLICY IF EXISTS "Members can view patrol checkpoints" ON public.patrol_checkpoints;

-- patrol_events
DROP POLICY IF EXISTS "Members can view patrol events" ON public.patrol_events;

-- patrol_routes
DROP POLICY IF EXISTS "Anon can read patrol_routes" ON public.patrol_routes;
DROP POLICY IF EXISTS "Members can view patrol routes" ON public.patrol_routes;

-- patrol_runs
DROP POLICY IF EXISTS "Anon can read patrol_runs" ON public.patrol_runs;
DROP POLICY IF EXISTS "Members can view patrol runs" ON public.patrol_runs;

-- personnel
DROP POLICY IF EXISTS "Anon can read personnel" ON public.personnel;
DROP POLICY IF EXISTS "Members can view personnel" ON public.personnel;

-- posts
DROP POLICY IF EXISTS "Anon can read posts" ON public.posts;
DROP POLICY IF EXISTS "Members can view posts" ON public.posts;

-- responses
DROP POLICY IF EXISTS "Members can view responses" ON public.responses;

-- shifts
DROP POLICY IF EXISTS "Anon can read shifts" ON public.shifts;
DROP POLICY IF EXISTS "Members can view shifts" ON public.shifts;
DROP POLICY IF EXISTS "Guards can update own shifts" ON public.shifts;

-- =====================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =====================================================

-- Drop old helpers
DROP FUNCTION IF EXISTS public.has_role(uuid, public.member_role);
DROP FUNCTION IF EXISTS public.get_user_org_ids(uuid);

-- 1) current_user_id
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT auth.uid() $$;

-- 2) user_org_id: returns the org_id for the current user (first active membership)
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.org_members
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1
$$;

-- 3) is_super_admin: checks if current user has super_admin role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  )
$$;

-- 4) has_role: checks if current user has a specific role in their org
CREATE OR REPLACE FUNCTION public.has_role(_role public.member_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
      AND role = _role
      AND is_active = true
      AND org_id = public.user_org_id()
  )
$$;

-- 5) can_access_object: role-based object access check
CREATE OR REPLACE FUNCTION public.can_access_object(_object_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- org roles can see all org objects
    EXISTS (
      SELECT 1 FROM public.objects o
      WHERE o.id = _object_id
        AND o.org_id = public.user_org_id()
        AND EXISTS (
          SELECT 1 FROM public.org_members om
          WHERE om.user_id = auth.uid()
            AND om.org_id = public.user_org_id()
            AND om.is_active = true
            AND om.role IN ('org_admin', 'dispatcher', 'chief', 'director', 'super_admin')
        )
    )
    -- client sees only assigned objects
    OR EXISTS (
      SELECT 1 FROM public.object_clients oc
      WHERE oc.object_id = _object_id AND oc.user_id = auth.uid()
    )
    -- guard sees objects linked to assigned shifts
    OR EXISTS (
      SELECT 1 FROM public.shifts s
      JOIN public.posts p ON p.id = s.post_id
      JOIN public.personnel per ON per.id = s.personnel_id
      WHERE p.object_id = _object_id
        AND per.user_id = auth.uid()
    )
  )
$$;

-- Helper: guard_personnel_id for current user
CREATE OR REPLACE FUNCTION public.guard_personnel_id()
RETURNS UUID
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.personnel
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1
$$;

-- Helper: guard's accessible object IDs via shifts
CREATE OR REPLACE FUNCTION public.guard_object_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.object_id
  FROM public.shifts s
  JOIN public.posts p ON p.id = s.post_id
  JOIN public.personnel per ON per.id = s.personnel_id
  WHERE per.user_id = auth.uid()
$$;

-- Helper: client's accessible object IDs
CREATE OR REPLACE FUNCTION public.client_object_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT object_id FROM public.object_clients WHERE user_id = auth.uid()
$$;

-- =====================================================
-- A) ORGANIZATIONS
-- =====================================================
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR id = public.user_org_id()
  );

CREATE POLICY "org_insert" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "org_update" ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "org_delete" ON public.organizations FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- Anon: read-only for demo (will be removed after auth)
CREATE POLICY "org_anon_select" ON public.organizations FOR SELECT TO anon USING (true);

-- =====================================================
-- B) ORG_MEMBERS
-- =====================================================
CREATE POLICY "om_select" ON public.org_members FOR SELECT TO authenticated
  USING (org_id = public.user_org_id() OR public.is_super_admin());

CREATE POLICY "om_insert" ON public.org_members FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "om_update" ON public.org_members FOR UPDATE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "om_delete" ON public.org_members FOR DELETE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- =====================================================
-- C) COUNTERPARTIES
-- =====================================================
CREATE POLICY "cp_select" ON public.counterparties FOR SELECT TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "cp_insert" ON public.counterparties FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "cp_update" ON public.counterparties FOR UPDATE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "cp_delete" ON public.counterparties FOR DELETE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- =====================================================
-- D) OBJECTS
-- =====================================================
CREATE POLICY "obj_select" ON public.objects FOR SELECT TO authenticated
  USING (public.can_access_object(id));

CREATE POLICY "obj_insert" ON public.objects FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "obj_update" ON public.objects FOR UPDATE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "obj_delete" ON public.objects FOR DELETE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- Anon: read-only for demo
CREATE POLICY "obj_anon_select" ON public.objects FOR SELECT TO anon USING (true);

-- =====================================================
-- E) OBJECT_CLIENTS
-- =====================================================
CREATE POLICY "oc_select" ON public.object_clients FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      object_id IN (SELECT id FROM public.objects WHERE org_id = public.user_org_id())
      AND (public.has_role('org_admin') OR public.is_super_admin())
    )
  );

CREATE POLICY "oc_insert" ON public.object_clients FOR INSERT TO authenticated
  WITH CHECK (
    object_id IN (SELECT id FROM public.objects WHERE org_id = public.user_org_id())
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "oc_delete" ON public.object_clients FOR DELETE TO authenticated
  USING (
    object_id IN (SELECT id FROM public.objects WHERE org_id = public.user_org_id())
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- =====================================================
-- F) POSTS
-- =====================================================
CREATE POLICY "post_select" ON public.posts FOR SELECT TO authenticated
  USING (public.can_access_object(object_id));

CREATE POLICY "post_insert" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "post_update" ON public.posts FOR UPDATE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "post_delete" ON public.posts FOR DELETE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- Anon: read-only for demo
CREATE POLICY "post_anon_select" ON public.posts FOR SELECT TO anon USING (true);

-- =====================================================
-- G) PERSONNEL
-- =====================================================
CREATE POLICY "pers_select" ON public.personnel FOR SELECT TO authenticated
  USING (
    -- org roles see all org personnel
    (
      org_id = public.user_org_id()
      AND EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id = public.user_org_id()
          AND om.is_active = true
          AND om.role IN ('org_admin', 'dispatcher', 'chief', 'director', 'super_admin')
      )
    )
    -- guard sees only own record
    OR (user_id = auth.uid())
  );

CREATE POLICY "pers_insert" ON public.personnel FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "pers_update" ON public.personnel FOR UPDATE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "pers_delete" ON public.personnel FOR DELETE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- Anon: read-only for demo
CREATE POLICY "pers_anon_select" ON public.personnel FOR SELECT TO anon USING (true);

-- =====================================================
-- H) SHIFTS
-- =====================================================
CREATE POLICY "shift_select" ON public.shifts FOR SELECT TO authenticated
  USING (
    -- org roles see all org shifts
    (
      org_id = public.user_org_id()
      AND EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id = public.user_org_id()
          AND om.is_active = true
          AND om.role IN ('org_admin', 'dispatcher', 'chief', 'director', 'super_admin')
      )
    )
    -- guard sees own shifts only
    OR personnel_id = public.guard_personnel_id()
    -- client sees shifts for their objects
    OR (
      post_id IN (
        SELECT p.id FROM public.posts p
        WHERE p.object_id IN (SELECT public.client_object_ids())
      )
    )
  );

CREATE POLICY "shift_insert" ON public.shifts FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "shift_update" ON public.shifts FOR UPDATE TO authenticated
  USING (
    -- org_admin: full within org
    (
      org_id = public.user_org_id()
      AND (public.has_role('org_admin') OR public.is_super_admin())
    )
    -- guard: only own shifts
    OR (
      personnel_id = public.guard_personnel_id()
      AND public.has_role('guard')
    )
  );

CREATE POLICY "shift_delete" ON public.shifts FOR DELETE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- Anon: read-only for demo
CREATE POLICY "shift_anon_select" ON public.shifts FOR SELECT TO anon USING (true);

-- =====================================================
-- I) PATROL_ROUTES
-- =====================================================
CREATE POLICY "pr_select" ON public.patrol_routes FOR SELECT TO authenticated
  USING (public.can_access_object(object_id));

CREATE POLICY "pr_insert" ON public.patrol_routes FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "pr_update" ON public.patrol_routes FOR UPDATE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "pr_delete" ON public.patrol_routes FOR DELETE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- Anon: read-only for demo
CREATE POLICY "pr_anon_select" ON public.patrol_routes FOR SELECT TO anon USING (true);

-- =====================================================
-- J) PATROL_CHECKPOINTS
-- =====================================================
CREATE POLICY "pc_select" ON public.patrol_checkpoints FOR SELECT TO authenticated
  USING (
    route_id IN (
      SELECT id FROM public.patrol_routes WHERE public.can_access_object(object_id)
    )
  );

CREATE POLICY "pc_insert" ON public.patrol_checkpoints FOR INSERT TO authenticated
  WITH CHECK (
    route_id IN (
      SELECT id FROM public.patrol_routes
      WHERE org_id = public.user_org_id()
    )
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "pc_update" ON public.patrol_checkpoints FOR UPDATE TO authenticated
  USING (
    route_id IN (
      SELECT id FROM public.patrol_routes
      WHERE org_id = public.user_org_id()
    )
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "pc_delete" ON public.patrol_checkpoints FOR DELETE TO authenticated
  USING (
    route_id IN (
      SELECT id FROM public.patrol_routes
      WHERE org_id = public.user_org_id()
    )
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- Anon: read-only for demo
CREATE POLICY "pc_anon_select" ON public.patrol_checkpoints FOR SELECT TO anon USING (true);

-- =====================================================
-- K) PATROL_RUNS
-- =====================================================
CREATE POLICY "prun_select" ON public.patrol_runs FOR SELECT TO authenticated
  USING (
    -- org roles
    (
      org_id = public.user_org_id()
      AND EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id = public.user_org_id()
          AND om.is_active = true
          AND om.role IN ('org_admin', 'dispatcher', 'chief', 'director', 'super_admin')
      )
    )
    -- guard: runs linked to own shifts
    OR shift_id IN (
      SELECT id FROM public.shifts WHERE personnel_id = public.guard_personnel_id()
    )
    -- client: runs for their objects
    OR route_id IN (
      SELECT id FROM public.patrol_routes WHERE object_id IN (SELECT public.client_object_ids())
    )
  );

CREATE POLICY "prun_insert" ON public.patrol_runs FOR INSERT TO authenticated
  WITH CHECK (
    -- org_admin
    (
      org_id = public.user_org_id()
      AND (public.has_role('org_admin') OR public.is_super_admin())
    )
    -- guard: only for own shifts
    OR (
      public.has_role('guard')
      AND org_id = public.user_org_id()
      AND shift_id IN (SELECT id FROM public.shifts WHERE personnel_id = public.guard_personnel_id())
    )
  );

CREATE POLICY "prun_update" ON public.patrol_runs FOR UPDATE TO authenticated
  USING (
    (
      org_id = public.user_org_id()
      AND (public.has_role('org_admin') OR public.is_super_admin())
    )
    OR (
      public.has_role('guard')
      AND shift_id IN (SELECT id FROM public.shifts WHERE personnel_id = public.guard_personnel_id())
    )
  );

CREATE POLICY "prun_delete" ON public.patrol_runs FOR DELETE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- Anon: read-only for demo
CREATE POLICY "prun_anon_select" ON public.patrol_runs FOR SELECT TO anon USING (true);

-- =====================================================
-- L) PATROL_EVENTS
-- =====================================================
CREATE POLICY "pe_select" ON public.patrol_events FOR SELECT TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.patrol_runs pr
      WHERE
        (
          pr.org_id = public.user_org_id()
          AND EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = auth.uid()
              AND om.org_id = public.user_org_id()
              AND om.is_active = true
              AND om.role IN ('org_admin', 'dispatcher', 'chief', 'director', 'super_admin')
          )
        )
        OR pr.shift_id IN (SELECT id FROM public.shifts WHERE personnel_id = public.guard_personnel_id())
        OR pr.route_id IN (SELECT id FROM public.patrol_routes WHERE object_id IN (SELECT public.client_object_ids()))
    )
  );

CREATE POLICY "pe_insert" ON public.patrol_events FOR INSERT TO authenticated
  WITH CHECK (
    -- guard: only for own runs
    run_id IN (
      SELECT id FROM public.patrol_runs pr
      WHERE pr.shift_id IN (SELECT id FROM public.shifts WHERE personnel_id = public.guard_personnel_id())
    )
    OR (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "pe_update" ON public.patrol_events FOR UPDATE TO authenticated
  USING (public.has_role('org_admin') OR public.is_super_admin());

CREATE POLICY "pe_delete" ON public.patrol_events FOR DELETE TO authenticated
  USING (public.has_role('org_admin') OR public.is_super_admin());

-- =====================================================
-- M) INCIDENTS
-- =====================================================
CREATE POLICY "inc_select" ON public.incidents FOR SELECT TO authenticated
  USING (
    -- org roles
    (
      org_id = public.user_org_id()
      AND EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id = public.user_org_id()
          AND om.is_active = true
          AND om.role IN ('org_admin', 'dispatcher', 'chief', 'director', 'super_admin')
      )
    )
    -- guard: incidents for guard's objects
    OR object_id IN (SELECT public.guard_object_ids())
    -- client: incidents for client's objects
    OR object_id IN (SELECT public.client_object_ids())
  );

CREATE POLICY "inc_insert" ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND created_by_user = auth.uid()
    AND (
      public.has_role('guard')
      OR public.has_role('dispatcher')
      OR public.has_role('org_admin')
      OR public.is_super_admin()
    )
  );

CREATE POLICY "inc_update" ON public.incidents FOR UPDATE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (
      public.has_role('dispatcher')
      OR public.has_role('org_admin')
      OR public.is_super_admin()
    )
  );

CREATE POLICY "inc_delete" ON public.incidents FOR DELETE TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- Anon: read-only for demo
CREATE POLICY "inc_anon_select" ON public.incidents FOR SELECT TO anon USING (true);

-- =====================================================
-- N) RESPONSES
-- =====================================================
CREATE POLICY "resp_select" ON public.responses FOR SELECT TO authenticated
  USING (
    incident_id IN (
      SELECT id FROM public.incidents i
      WHERE
        (i.org_id = public.user_org_id())
        OR i.object_id IN (SELECT public.client_object_ids())
        OR i.object_id IN (SELECT public.guard_object_ids())
    )
  );

CREATE POLICY "resp_insert" ON public.responses FOR INSERT TO authenticated
  WITH CHECK (
    incident_id IN (SELECT id FROM public.incidents WHERE org_id = public.user_org_id())
    AND (public.has_role('dispatcher') OR public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "resp_update" ON public.responses FOR UPDATE TO authenticated
  USING (
    incident_id IN (SELECT id FROM public.incidents WHERE org_id = public.user_org_id())
    AND (public.has_role('dispatcher') OR public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "resp_delete" ON public.responses FOR DELETE TO authenticated
  USING (
    incident_id IN (SELECT id FROM public.incidents WHERE org_id = public.user_org_id())
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- =====================================================
-- O) OBJECT_ACCEPTANCE
-- =====================================================
CREATE POLICY "oa_select" ON public.object_acceptance FOR SELECT TO authenticated
  USING (
    -- org roles
    object_id IN (SELECT id FROM public.objects WHERE org_id = public.user_org_id())
    -- client
    OR object_id IN (SELECT public.client_object_ids())
  );

CREATE POLICY "oa_insert" ON public.object_acceptance FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- client: only for assigned objects
      (public.has_role('client') AND object_id IN (SELECT public.client_object_ids()))
      -- org_admin / chief
      OR (
        (public.has_role('org_admin') OR public.has_role('chief') OR public.is_super_admin())
        AND object_id IN (SELECT id FROM public.objects WHERE org_id = public.user_org_id())
      )
    )
  );

CREATE POLICY "oa_update" ON public.object_acceptance FOR UPDATE TO authenticated
  USING (
    object_id IN (SELECT id FROM public.objects WHERE org_id = public.user_org_id())
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

CREATE POLICY "oa_delete" ON public.object_acceptance FOR DELETE TO authenticated
  USING (
    object_id IN (SELECT id FROM public.objects WHERE org_id = public.user_org_id())
    AND (public.has_role('org_admin') OR public.is_super_admin())
  );

-- =====================================================
-- P) AUDIT_LOG (append-only)
-- =====================================================
CREATE POLICY "al_select" ON public.audit_log FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR org_id = public.user_org_id()
    OR user_id = auth.uid()
  );

CREATE POLICY "al_insert" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (org_id IS NULL OR org_id = public.user_org_id())
  );

-- NO UPDATE or DELETE policies = immutable audit log
