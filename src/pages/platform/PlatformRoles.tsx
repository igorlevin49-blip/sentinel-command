import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Shield, UserPlus, X } from 'lucide-react';

type PlatformRoleEnum = 'platform_super_admin' | 'platform_admin' | 'platform_dispatcher' | 'platform_director';

interface PlatformRole {
  id: string;
  user_id: string;
  role: PlatformRoleEnum;
  is_active: boolean;
  granted_by: string | null;
  created_at: string;
}

const roleLabels: Record<PlatformRoleEnum, string> = {
  platform_super_admin: 'Платформ. Суперадмин',
  platform_admin: 'Платформ. Администратор',
  platform_dispatcher: 'Диспетчер ЦОУ',
  platform_director: 'Директор платформы',
};

const roleBadgeVariants: Record<PlatformRoleEnum, string> = {
  platform_super_admin: 'bg-destructive/15 text-destructive border-destructive/30',
  platform_admin: 'bg-primary/15 text-primary border-primary/30',
  platform_dispatcher: 'bg-warning/15 text-warning border-warning/30',
  platform_director: 'bg-accent/15 text-accent border-accent/30',
};

export default function PlatformRoles() {
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchRoles() {
    const { data, error } = await supabase
      .from('platform_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.code === '42501' ? 'Нет доступа к платформенным ролям' : error.message);
    } else {
      setRoles((data as PlatformRole[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchRoles(); }, []);

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('platform_roles').update({ is_active: !current }).eq('id', id);
    fetchRoles();
  }

  return (
    <AppLayout title="Платформенные роли">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Роли платформы QOR</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Управление доступом к функциям платформы (отдельно от org_members).
            </p>
          </div>
          <button
            onClick={() => alert('TODO: форма добавления пользователя')}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Добавить
          </button>
        </div>

        {/* RBAC Matrix info */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Матрица прав платформенных ролей
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-muted-foreground">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 pr-4 font-medium text-foreground">Ресурс</th>
                  <th className="py-1.5 px-3 text-center">Суперадмин</th>
                  <th className="py-1.5 px-3 text-center">Администратор</th>
                  <th className="py-1.5 px-3 text-center">Диспетчер ЦОУ</th>
                  <th className="py-1.5 px-3 text-center">Директор</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['Организации', 'CRUD', 'R', '—', 'R'],
                  ['Платф. роли', 'CRUD', 'R', '—', '—'],
                  ['Все инциденты', 'CRUD', 'RU', 'RU', 'R'],
                  ['Контракты', 'CRUD', 'CRUD', '—', 'R'],
                  ['SLA правила', 'CRUD', 'CRUD', 'R', 'R'],
                  ['Аудит лог', 'R', 'R', '—', 'R'],
                  ['Аналитика', 'R', 'R', 'R', 'R'],
                ].map(([res, sa, ad, d, dir]) => (
                  <tr key={res}>
                    <td className="py-1.5 pr-4 font-medium text-foreground">{res}</td>
                    <td className="py-1.5 px-3 text-center">{sa}</td>
                    <td className="py-1.5 px-3 text-center">{ad}</td>
                    <td className="py-1.5 px-3 text-center">{d}</td>
                    <td className="py-1.5 px-3 text-center">{dir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roles list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Платформенные роли не назначены</p>
            <p className="text-sm text-muted-foreground mt-1">
              Нажмите «Добавить» чтобы выдать пользователю роль платформы.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Пользователь</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Роль</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Дата</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roles.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.user_id.slice(0, 8)}…</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${roleBadgeVariants[r.role]}`}>
                        {roleLabels[r.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={r.is_active ? 'success' : 'secondary'}>
                        {r.is_active ? 'Активна' : 'Отключена'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('ru')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => toggleActive(r.id, r.is_active)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {r.is_active ? <X className="h-4 w-4" /> : '✓'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
