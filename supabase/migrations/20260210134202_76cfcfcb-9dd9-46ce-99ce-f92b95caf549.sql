
-- Tighten audit_log INSERT: require user_id matches the inserting user
DROP POLICY "Authenticated can insert audit log" ON public.audit_log;
CREATE POLICY "Authenticated can insert own audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
