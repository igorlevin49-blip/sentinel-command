
-- ================================================================
-- S-OMS Migration: Fix user_org_id, can_access_object, posts RLS,
--                  add posts.description column
-- Idempotent: all functions replaced, policies dropped then recreated
-- ================================================================

-- ----------------------------------------------------------------
-- 1. STABILIZE user_org_id()
--    Priority: non-super_admin roles first (order=1), super_admin last (order=2)
--    Within same priority: oldest membership (created_at ASC) wins.
--    This ensures a user with both super_admin + org_admin memberships
--    always gets the "working" org, not the platform org.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_org_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT org_id
  FROM public.org_members
  WHERE user_id  = auth.uid()
    AND is_active = true
  ORDER BY
    CASE role
      WHEN 'super_admin' THEN 2
      ELSE 1
    END ASC,
    created_at ASC
  LIMIT 1;
$$;

-- ----------------------------------------------------------------
-- 2. HARDEN is_super_admin() — ensure it exists and is clean
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id  = auth.uid()
      AND role      = 'super_admin'
      AND is_active = true
  );
$$;

-- ----------------------------------------------------------------
-- 3. HARDEN can_access_object(uuid)
--    super_admin → true immediately (early exit, no org check).
--    org roles (org_admin / dispatcher / chief / director) → same org objects.
--    guard / client → their assigned objects.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_object(_object_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT (
    -- super_admin sees everything, no org restriction
    public.is_super_admin()

    -- org operational roles see objects in their org
    OR EXISTS (
      SELECT 1 FROM public.objects o
      WHERE o.id = _object_id
        AND o.org_id = public.user_org_id()
        AND EXISTS (
          SELECT 1 FROM public.org_members om
          WHERE om.user_id  = auth.uid()
            AND om.org_id   = o.org_id
            AND om.is_active = true
            AND om.role IN ('org_admin','dispatcher','chief','director')
        )
    )

    -- client sees only their explicitly assigned objects
    OR EXISTS (
      SELECT 1 FROM public.object_clients oc
      WHERE oc.object_id = _object_id
        AND oc.user_id   = auth.uid()
    )

    -- guard sees objects of their shifts
    OR EXISTS (
      SELECT 1 FROM public.shifts s
      JOIN   public.posts    p   ON p.id  = s.post_id
      JOIN   public.personnel per ON per.id = s.personnel_id
      WHERE  p.object_id  = _object_id
        AND  per.user_id  = auth.uid()
    )
  );
$$;

-- ----------------------------------------------------------------
-- 4. ADD posts.description IF NOT EXISTS
--    Varian A: add the column so UI + seeds can use it.
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'posts'
      AND column_name  = 'description'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN description text;
    RAISE NOTICE 'Column posts.description added.';
  ELSE
    RAISE NOTICE 'Column posts.description already exists — skipped.';
  END IF;
END;
$$;

-- ----------------------------------------------------------------
-- 5. FIX posts RLS — close anon, open super_admin, keep org rules
-- ----------------------------------------------------------------

-- Drop all existing posts policies to rebuild cleanly
DROP POLICY IF EXISTS post_select  ON public.posts;
DROP POLICY IF EXISTS post_insert  ON public.posts;
DROP POLICY IF EXISTS post_update  ON public.posts;
DROP POLICY IF EXISTS post_delete  ON public.posts;

-- Also drop any legacy anon/public policies that may have leaked
DROP POLICY IF EXISTS post_anon_select ON public.posts;
DROP POLICY IF EXISTS posts_select     ON public.posts;
DROP POLICY IF EXISTS posts_insert     ON public.posts;
DROP POLICY IF EXISTS posts_update     ON public.posts;
DROP POLICY IF EXISTS posts_delete     ON public.posts;

-- Ensure RLS is ON
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated only
--   super_admin → all rows
--   org operational roles (org_admin/dispatcher/chief/director) → their org
--   guard → objects they have shifts on
--   client → objects they are assigned to
CREATE POLICY post_select ON public.posts
  FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR (
      org_id = public.user_org_id()
      AND EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.user_id  = auth.uid()
          AND om.org_id   = public.user_org_id()
          AND om.is_active = true
          AND om.role IN ('org_admin','dispatcher','chief','director')
      )
    )
    OR object_id IN (SELECT public.guard_object_ids())
    OR object_id IN (SELECT public.client_object_ids())
  );

-- INSERT: org_admin (and super_admin acting in an org) only
CREATE POLICY post_insert ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (
      public.has_role('org_admin'::member_role)
      OR public.is_super_admin()
    )
  );

-- UPDATE: same as insert
CREATE POLICY post_update ON public.posts
  FOR UPDATE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (
      public.has_role('org_admin'::member_role)
      OR public.is_super_admin()
    )
  );

-- DELETE: same
CREATE POLICY post_delete ON public.posts
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (
      public.has_role('org_admin'::member_role)
      OR public.is_super_admin()
    )
  );
