-- ============================================================
-- SECURITY PACK: Задача 1 + Задача 3
-- Применять в порядке секций.
-- Идемпотентно (IF EXISTS / OR REPLACE).
-- ============================================================

-- ============================================================
-- СЕКЦИЯ 1: Новый enum для платформенных ролей
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.platform_role AS ENUM (
    'platform_super_admin',
    'platform_admin',
    'platform_dispatcher',
    'platform_director'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- СЕКЦИЯ 2: Таблица platform_roles (платформенные роли)
-- Отдельно от org_members, чтобы избежать privilege escalation.
-- user_id → auth.users через UUID (не FK, чтобы не ломать RLS).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,  -- auth.users.id
  role       public.platform_role NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  granted_by uuid,           -- кто выдал (user_id)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- СЕКЦИЯ 3: Таблица org_types (типы организаций)
-- Дополняет существующие organizations.
-- ============================================================
DO $$ BEGIN
  ALTER TABLE public.organizations
    ADD COLUMN org_type text NOT NULL DEFAULT 'partner'
      CHECK (org_type IN ('platform','cou','partner','customer'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Помечаем платформенную org (фиксированный UUID для seed):
-- UPDATE public.organizations SET org_type='platform' WHERE ...
-- (делается отдельным seed, не здесь)

-- ============================================================
-- СЕКЦИЯ 4: Security-функции (платформенный уровень)
-- ============================================================

-- is_platform_super_admin(): пользователь имеет platform_super_admin
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id  = auth.uid()
      AND role      = 'platform_super_admin'
      AND is_active = true
  );
$$;

-- is_platform_staff(): пользователь — любой платформенный сотрудник
CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id  = auth.uid()
      AND is_active = true
  );
$$;

-- has_platform_role(_role): проверка конкретной платформенной роли
CREATE OR REPLACE FUNCTION public.has_platform_role(_role public.platform_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id  = auth.uid()
      AND role      = _role
      AND is_active = true
  );
$$;

-- user_org_ids(): массив всех org_id пользователя (для кросс-орг доступа)
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.org_members
  WHERE user_id  = auth.uid()
    AND is_active = true;
$$;

-- Стабилизированный user_org_id():
-- Приоритет: рабочие роли (не super_admin) раньше super_admin.
-- При нескольких рабочих — самая ранняя запись (created_at ASC).
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
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

-- is_super_admin(): сохраняем обратную совместимость
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id  = auth.uid()
      AND role      = 'super_admin'
      AND is_active = true
  );
$$;

-- ============================================================
-- СЕКЦИЯ 5: RLS для platform_roles
-- Только платформенные super admin управляют этой таблицей.
-- ============================================================
DROP POLICY IF EXISTS "pr_select" ON public.platform_roles;
DROP POLICY IF EXISTS "pr_insert" ON public.platform_roles;
DROP POLICY IF EXISTS "pr_update" ON public.platform_roles;
DROP POLICY IF EXISTS "pr_delete" ON public.platform_roles;

-- Видит себя или платформенный super admin видит всё
CREATE POLICY "pr_select"
  ON public.platform_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_super_admin() OR public.is_super_admin());

-- Создаёт только platform_super_admin или org super_admin (начальный сид)
CREATE POLICY "pr_insert"
  ON public.platform_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_super_admin() OR public.is_super_admin());

CREATE POLICY "pr_update"
  ON public.platform_roles FOR UPDATE
  TO authenticated
  USING (public.is_platform_super_admin() OR public.is_super_admin());

CREATE POLICY "pr_delete"
  ON public.platform_roles FOR DELETE
  TO authenticated
  USING (public.is_platform_super_admin() OR public.is_super_admin());

-- ============================================================
-- СЕКЦИЯ 6: Аудит RLS для public.posts
-- Убрать любые публичные/анонимные политики, перестроить.
-- ============================================================
DROP POLICY IF EXISTS "post_anon_select" ON public.posts;
DROP POLICY IF EXISTS "post_select"      ON public.posts;
DROP POLICY IF EXISTS "post_insert"      ON public.posts;
DROP POLICY IF EXISTS "post_update"      ON public.posts;
DROP POLICY IF EXISTS "post_delete"      ON public.posts;

-- SELECT: super_admin видит всё; остальные — через can_access_object
CREATE POLICY "post_select"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_platform_super_admin()
    OR public.can_access_object(object_id)
  );

-- INSERT: только org_admin / super_admin в своей org
CREATE POLICY "post_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = public.user_org_id())
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

-- UPDATE: только org_admin / super_admin в своей org
CREATE POLICY "post_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    (org_id = public.user_org_id())
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

-- DELETE: только org_admin / super_admin в своей org
CREATE POLICY "post_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    (org_id = public.user_org_id())
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

-- ============================================================
-- СЕКЦИЯ 7: can_access_object — ранний выход для super_admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_access_object(_object_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- platform super_admin видит всё
    public.is_platform_super_admin()

    -- org super_admin видит всё (без org ограничения)
    OR public.is_super_admin()

    -- org operational roles видят объекты своей org
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

    -- client видит только свои явно назначенные объекты
    OR EXISTS (
      SELECT 1 FROM public.object_clients oc
      WHERE oc.object_id = _object_id
        AND oc.user_id   = auth.uid()
    )

    -- guard видит объекты своих смен
    OR EXISTS (
      SELECT 1 FROM public.shifts s
      JOIN   public.posts    p   ON p.id   = s.post_id
      JOIN   public.personnel per ON per.id = s.personnel_id
      WHERE  p.object_id  = _object_id
        AND  per.user_id  = auth.uid()
    )
  );
$$;

-- ============================================================
-- СЕКЦИЯ 8: Таблицы Задачи 2 (схема новых сущностей)
-- contracts, sla_rules, dispatch_rules, escalation_rules
-- ============================================================

-- 8.1 contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_org_id uuid REFERENCES public.organizations(id),
  title           text NOT NULL,
  number          text,
  start_date      date,
  end_date        date,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('draft','active','suspended','terminated')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin() OR public.is_platform_super_admin()
    OR org_id = public.user_org_id()
    OR customer_org_id = public.user_org_id()
  );

CREATE POLICY "contracts_insert"
  ON public.contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

CREATE POLICY "contracts_update"
  ON public.contracts FOR UPDATE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

CREATE POLICY "contracts_delete"
  ON public.contracts FOR DELETE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

-- 8.2 sla_rules
CREATE TABLE IF NOT EXISTS public.sla_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_id      uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  name             text NOT NULL,
  incident_type    text,   -- alarm / violation / event / null = все
  severity         text,   -- low / medium / high / critical / null = все
  response_time_s  int NOT NULL DEFAULT 900,   -- сек до принятия
  resolve_time_s   int NOT NULL DEFAULT 3600,  -- сек до закрытия
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sla_select"
  ON public.sla_rules FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin() OR public.is_platform_super_admin()
    OR org_id = public.user_org_id()
  );

CREATE POLICY "sla_insert"
  ON public.sla_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

CREATE POLICY "sla_update"
  ON public.sla_rules FOR UPDATE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

CREATE POLICY "sla_delete"
  ON public.sla_rules FOR DELETE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

-- 8.3 dispatch_rules (правила маршрутизации инцидентов)
CREATE TABLE IF NOT EXISTS public.dispatch_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  priority        int  NOT NULL DEFAULT 0,  -- выше = применяется первым
  condition_json  jsonb,  -- {severity:["high","critical"], org_type:"partner"}
  action_json     jsonb,  -- {assign_to_role:"dispatcher", escalate_after_s:300}
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dispatch_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispatch_select"
  ON public.dispatch_rules FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin() OR public.is_platform_super_admin()
    OR org_id = public.user_org_id()
  );

CREATE POLICY "dispatch_insert"
  ON public.dispatch_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

CREATE POLICY "dispatch_update"
  ON public.dispatch_rules FOR UPDATE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

CREATE POLICY "dispatch_delete"
  ON public.dispatch_rules FOR DELETE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

-- 8.4 escalation_rules
CREATE TABLE IF NOT EXISTS public.escalation_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sla_rule_id      uuid REFERENCES public.sla_rules(id) ON DELETE SET NULL,
  name             text NOT NULL,
  trigger_after_s  int  NOT NULL DEFAULT 600,  -- сек без ответа → эскалация
  action           text NOT NULL DEFAULT 'notify'
                     CHECK (action IN ('notify','reassign','page','close')),
  target_role      text,  -- роль, которой уходит уведомление
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esc_select"
  ON public.escalation_rules FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin() OR public.is_platform_super_admin()
    OR org_id = public.user_org_id()
  );

CREATE POLICY "esc_insert"
  ON public.escalation_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

CREATE POLICY "esc_update"
  ON public.escalation_rules FOR UPDATE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

CREATE POLICY "esc_delete"
  ON public.escalation_rules FOR DELETE
  TO authenticated
  USING (
    org_id = public.user_org_id()
    AND (public.has_role('org_admin'::member_role) OR public.is_super_admin())
  );

-- ============================================================
-- СЕКЦИЯ 9: Закрыть oстаточные anon-доступы к org_members
-- (на случай если roles={public} осталось из старых миграций)
-- ============================================================
DROP POLICY IF EXISTS "org_members_anon_select" ON public.org_members;
DROP POLICY IF EXISTS "org_members_public_select" ON public.org_members;