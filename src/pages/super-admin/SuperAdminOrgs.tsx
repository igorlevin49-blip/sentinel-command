import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Org {
  id: string;
  name: string;
  type: string;
  org_type: string;
  created_at: string;
}

export default function SuperAdminOrgs() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.code === '42501' ? 'Нет доступа к организациям' : error.message);
    } else {
      setOrgs((data as Org[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  return (
    <AppLayout title="Организации">
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Все организации платформы</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Полный реестр организаций, подключённых к S-OMS.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : orgs.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Организации не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">В системе ещё нет зарегистрированных организаций.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тип</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Создана</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{org.name}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="text-xs">
                        {org.type === 'security_agency' ? 'Охранное агентство' : 'Внутренняя охрана'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground" title={org.id}>
                      {org.id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString('ru')}
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
