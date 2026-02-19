import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OrgMember {
  id: string;
  user_id: string;
  org_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  super_admin: 'Суперадмин',
  org_admin: 'Администратор',
  dispatcher: 'Диспетчер',
  chief: 'Нач. охраны',
  director: 'Директор',
  guard: 'Охранник',
  client: 'Заказчик',
};

export default function SuperAdminUsers() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('org_members')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      setError(error.code === '42501' ? 'Нет доступа к пользователям' : error.message);
    } else {
      setMembers((data as OrgMember[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return (
    <AppLayout title="Пользователи">
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Пользователи и роли организаций</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Все участники org_members по всем организациям платформы.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Участники не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">В системе нет зарегистрированных участников.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Org ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Роль</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground" title={m.user_id}>{m.user_id.slice(0, 8)}…</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground" title={m.org_id}>{m.org_id.slice(0, 8)}…</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="text-xs">{roleLabels[m.role] ?? m.role}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={m.is_active ? 'success' : 'secondary'}>
                        {m.is_active ? 'Активен' : 'Отключён'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString('ru')}
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
