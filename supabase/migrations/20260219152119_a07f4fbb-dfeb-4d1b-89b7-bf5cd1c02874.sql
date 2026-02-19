
-- ─────────────────────────────────────────────────────
-- Delivery Tracking System tables
-- ─────────────────────────────────────────────────────

-- 1) delivery_items
CREATE TABLE IF NOT EXISTS public.delivery_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  key         text        UNIQUE NOT NULL,
  title       text        NOT NULL,
  description text,
  area        text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('epic','issue','task','uat')),
  status      text        NOT NULL CHECK (status IN ('todo','in_progress','review','done','blocked')),
  priority    text        NOT NULL CHECK (priority IN ('p0','p1','p2','p3')),
  owner       text,
  parent_id   uuid        REFERENCES public.delivery_items(id) ON DELETE SET NULL
);

ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER delivery_items_updated_at
  BEFORE UPDATE ON public.delivery_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) delivery_checks
CREATE TABLE IF NOT EXISTS public.delivery_checks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         uuid        NOT NULL REFERENCES public.delivery_items(id) ON DELETE CASCADE,
  kind            text        NOT NULL CHECK (kind IN ('dod','uat','github')),
  title           text        NOT NULL,
  is_done         boolean     NOT NULL DEFAULT false,
  evidence_text   text,
  evidence_url    text,
  last_verified_at timestamptz
);

ALTER TABLE public.delivery_checks ENABLE ROW LEVEL SECURITY;

-- 3) delivery_github_links
CREATE TABLE IF NOT EXISTS public.delivery_github_links (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      uuid  NOT NULL REFERENCES public.delivery_items(id) ON DELETE CASCADE,
  repo         text  NOT NULL,
  issue_number int,
  pr_number    int,
  url          text
);

ALTER TABLE public.delivery_github_links ENABLE ROW LEVEL SECURITY;

-- 4) delivery_alerts
CREATE TABLE IF NOT EXISTS public.delivery_alerts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  severity    text        NOT NULL CHECK (severity IN ('info','warn','critical')),
  type        text        NOT NULL CHECK (type IN ('needs_github_action','blocked','p0_open','rls_denied','test_failed')),
  item_id     uuid        REFERENCES public.delivery_items(id) ON DELETE SET NULL,
  message     text        NOT NULL,
  action_url  text,
  is_active   boolean     NOT NULL DEFAULT true
);

ALTER TABLE public.delivery_alerts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────
-- RLS helper: platform write access
-- (super_admin, platform_admin, platform_director = full CRUD)
-- (platform_dispatcher = read only)
-- ─────────────────────────────────────────────────────

-- delivery_items policies
CREATE POLICY di_select ON public.delivery_items FOR SELECT
  USING (is_platform_staff());

CREATE POLICY di_insert ON public.delivery_items FOR INSERT
  WITH CHECK (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

CREATE POLICY di_update ON public.delivery_items FOR UPDATE
  USING (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

CREATE POLICY di_delete ON public.delivery_items FOR DELETE
  USING (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

-- delivery_checks policies
CREATE POLICY dc_select ON public.delivery_checks FOR SELECT
  USING (is_platform_staff());

CREATE POLICY dc_insert ON public.delivery_checks FOR INSERT
  WITH CHECK (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

CREATE POLICY dc_update ON public.delivery_checks FOR UPDATE
  USING (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

CREATE POLICY dc_delete ON public.delivery_checks FOR DELETE
  USING (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

-- delivery_github_links policies
CREATE POLICY dg_select ON public.delivery_github_links FOR SELECT
  USING (is_platform_staff());

CREATE POLICY dg_insert ON public.delivery_github_links FOR INSERT
  WITH CHECK (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

CREATE POLICY dg_update ON public.delivery_github_links FOR UPDATE
  USING (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

CREATE POLICY dg_delete ON public.delivery_github_links FOR DELETE
  USING (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

-- delivery_alerts policies
CREATE POLICY da_select ON public.delivery_alerts FOR SELECT
  USING (is_platform_staff());

CREATE POLICY da_insert ON public.delivery_alerts FOR INSERT
  WITH CHECK (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

CREATE POLICY da_update ON public.delivery_alerts FOR UPDATE
  USING (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );

CREATE POLICY da_delete ON public.delivery_alerts FOR DELETE
  USING (
    has_platform_role('platform_super_admin') OR
    has_platform_role('platform_admin') OR
    has_platform_role('platform_director')
  );
