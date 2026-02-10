-- Assign super_admin to egor.smart@inbox.ru
-- Use the existing org as a "home" org for the super_admin record
INSERT INTO public.org_members (org_id, user_id, role, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '5ef5a2b9-ff44-4e6a-b542-10d08fa22f60',
  'super_admin',
  true
)
ON CONFLICT DO NOTHING;