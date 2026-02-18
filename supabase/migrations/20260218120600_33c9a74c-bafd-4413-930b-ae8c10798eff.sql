
-- ============================================================
-- FIX 1: Стабилизировать user_org_id() — явный ORDER BY
-- чтобы при нескольких membership возвращался предсказуемый org_id
-- (приоритет: не super_admin org, а рабочая org)
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_org_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT org_id 
  FROM public.org_members
  WHERE user_id = auth.uid() 
    AND is_active = true
    -- Приоритет: org_admin/dispatcher/chief/director/guard/client раньше super_admin
    -- чтобы при двух membership возвращался «рабочий» org
  ORDER BY 
    CASE role 
      WHEN 'super_admin' THEN 2 
      ELSE 1 
    END ASC,
    created_at ASC
  LIMIT 1
$function$;

-- ============================================================
-- FIX 2: can_access_object — super_admin видит ВСЕ объекты
-- Текущая реализация проверяет org_id = user_org_id() для super_admin,
-- но если user_org_id() вернул другой org — фильтрация ломается.
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_access_object(_object_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (
    -- super_admin видит все объекты без ограничений
    public.is_super_admin()
    -- org roles (org_admin, dispatcher, chief, director) видят объекты своей org
    OR EXISTS (
      SELECT 1 FROM public.objects o
      WHERE o.id = _object_id
        AND o.org_id = public.user_org_id()
        AND EXISTS (
          SELECT 1 FROM public.org_members om
          WHERE om.user_id = auth.uid()
            AND om.org_id = o.org_id
            AND om.is_active = true
            AND om.role IN ('org_admin', 'dispatcher', 'chief', 'director')
        )
    )
    -- client видит только назначенные объекты
    OR EXISTS (
      SELECT 1 FROM public.object_clients oc
      WHERE oc.object_id = _object_id AND oc.user_id = auth.uid()
    )
    -- guard видит объекты своих смен
    OR EXISTS (
      SELECT 1 FROM public.shifts s
      JOIN public.posts p ON p.id = s.post_id
      JOIN public.personnel per ON per.id = s.personnel_id
      WHERE p.object_id = _object_id
        AND per.user_id = auth.uid()
    )
  )
$function$;

-- ============================================================
-- FIX 3: post_select RLS — для super_admin и org_admin
-- прямая проверка org_id (не через can_access_object который зависит от object)
-- ============================================================
DROP POLICY IF EXISTS post_select ON public.posts;

CREATE POLICY post_select ON public.posts
  FOR SELECT
  USING (
    -- super_admin видит всё
    public.is_super_admin()
    -- org members (admin/dispatcher/chief/director) видят посты своего org
    OR (
      org_id = public.user_org_id()
      AND EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id = public.user_org_id()
          AND om.is_active = true
          AND om.role IN ('org_admin', 'dispatcher', 'chief', 'director')
      )
    )
    -- guard видит посты объектов своих смен
    OR object_id IN (SELECT public.guard_object_ids())
    -- client видит посты своих объектов
    OR object_id IN (SELECT public.client_object_ids())
  );
