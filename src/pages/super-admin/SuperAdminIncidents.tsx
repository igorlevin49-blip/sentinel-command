import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Incident {
  id: string;
  org_id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  created: 'Создан',
  accepted: 'Принят',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const severityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

const severityVariants: Record<string, 'secondary' | 'warning' | 'outline' | 'destructive'> = {
  low: 'secondary',
  medium: 'warning',
  high: 'outline',
  critical: 'destructive',
};

export default function SuperAdminIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('incidents')
      .select('id, org_id, title, type, severity, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      setError(error.code === '42501' ? 'Нет доступа к инцидентам' : error.message);
    } else {
      setIncidents((data as Incident[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  return (
    <AppLayout title="Инциденты">
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Все инциденты платформы</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Сводная лента инцидентов по всем организациям. Только чтение.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Инциденты не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">В системе нет зарегистрированных инцидентов.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Инцидент</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Приоритет</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Org ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Создан</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{inc.title}</p>
                      <p className="text-xs text-muted-foreground">{inc.type}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={severityVariants[inc.severity] ?? 'secondary'}>
                        {severityLabels[inc.severity] ?? inc.severity}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {statusLabels[inc.status] ?? inc.status}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground" title={inc.org_id}>
                      {inc.org_id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(inc.created_at).toLocaleString('ru', { dateStyle: 'short', timeStyle: 'short' })}
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
