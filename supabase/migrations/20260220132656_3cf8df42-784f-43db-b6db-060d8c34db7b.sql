
-- 1) SELECT: all platform staff can read all incidents cross-org
CREATE POLICY "inc_select_platform_staff"
ON public.incidents
FOR SELECT
USING (is_platform_staff());

-- 2) UPDATE: platform dispatcher/admin/super_admin can update incidents
--    (director is excluded — read-only)
CREATE POLICY "inc_update_platform"
ON public.incidents
FOR UPDATE
USING (
  has_platform_role('platform_dispatcher'::platform_role)
  OR has_platform_role('platform_admin'::platform_role)
  OR has_platform_role('platform_super_admin'::platform_role)
);
