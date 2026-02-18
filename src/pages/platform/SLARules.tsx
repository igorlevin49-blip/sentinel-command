import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus } from 'lucide-react';

interface SLARule {
  id: string;
  org_id: string;
  name: string;
  incident_type: string | null;
  severity: string | null;
  response_time_s: number;
  resolve_time_s: number;
  is_active: boolean;
  created_at: string;
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}с`;
  if (s < 3600) return `${Math.round(s / 60)}мин`;
  return `${Math.round(s / 3600)}ч`;
}

export default function SLARules() {
  const [rules, setRules] = useState<SLARule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('sla_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.code === '42501' ? 'Нет доступа к SLA правилам' : error.message);
      } else {
        setRules((data as SLARule[]) ?? []);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <AppLayout title="SLA Правила">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Правила уровня сервиса (SLA)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Таймеры реакции и закрытия инцидентов по типу и приоритету.
            </p>
          </div>
          <button
            onClick={() => alert('TODO: форма создания SLA')}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить SLA
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">SLA правила не настроены</p>
            <p className="text-sm text-muted-foreground mt-1">Добавьте первое правило чтобы настроить SLA.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тип</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Приоритет</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Реакция</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Закрытие</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{r.incident_type ?? 'Все'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{r.severity ?? 'Все'}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-medium text-warning">{formatSeconds(r.response_time_s)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-medium text-muted-foreground">{formatSeconds(r.resolve_time_s)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={r.is_active ? 'success' : 'secondary'}>
                        {r.is_active ? 'Активно' : 'Откл.'}
                      </Badge>
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
