
-- ============================================================
-- MIGRATION: incident_events + incidents extra fields + shifts
-- ============================================================

-- 1. Add missing columns to incidents
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS assigned_to_personnel_id uuid REFERENCES public.personnel(id),
  ADD COLUMN IF NOT EXISTS en_route_at timestamptz,
  ADD COLUMN IF NOT EXISTS on_site_at timestamptz,
  ADD COLUMN IF NOT EXISTS triaged_at timestamptz;

-- 2. Add object_id to shifts (derived from post.object_id for convenience)
ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS object_id uuid REFERENCES public.objects(id);

-- Backfill shifts.object_id from posts.object_id where null
UPDATE public.shifts s
SET object_id = p.object_id
FROM public.posts p
WHERE p.id = s.post_id AND s.object_id IS NULL;

-- 3. Create incident_events table
CREATE TABLE IF NOT EXISTS public.incident_events (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id    uuid        NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  org_id         uuid        NOT NULL REFERENCES public.organizations(id),
  actor_user_id  uuid        NOT NULL,
  event_type     text        NOT NULL, -- created/triaged/assigned/status_changed/comment
  payload_json   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id ON public.incident_events(incident_id, created_at);
CREATE INDEX IF NOT EXISTS idx_incident_events_org_id ON public.incident_events(org_id);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON public.incidents(org_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_object_id ON public.shifts(object_id);

-- 5. RLS for incident_events
ALTER TABLE public.incident_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ie_select ON public.incident_events
  FOR SELECT USING (
    org_id = public.user_org_id()
    OR public.is_platform_super_admin()
  );

CREATE POLICY ie_insert ON public.incident_events
  FOR INSERT WITH CHECK (
    org_id = public.user_org_id()
    AND actor_user_id = auth.uid()
    AND (
      public.has_role('org_admin'::member_role)
      OR public.has_role('dispatcher'::member_role)
      OR public.has_role('chief'::member_role)
      OR public.has_role('guard'::member_role)
    )
  );

CREATE POLICY ie_delete ON public.incident_events
  FOR DELETE USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

-- 6. Update incidents RLS: allow platform_super_admin to SELECT cross-org
-- (add supplementary permissive policy)
DROP POLICY IF EXISTS inc_select_platform ON public.incidents;
CREATE POLICY inc_select_platform ON public.incidents
  FOR SELECT USING (public.is_platform_super_admin());
