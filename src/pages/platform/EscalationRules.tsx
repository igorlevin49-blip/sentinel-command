import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus } from 'lucide-react';

interface EscalationRule {
  id: string;
  org_id: string;
  name: string;
  trigger_after_s: number;
  action: 'notify' | 'reassign' | 'page' | 'close';
  target_role: string | null;
  is_active: boolean;
  created_at: string;
}

const actionLabels: Record<EscalationRule['action'], string> = {
  notify: 'Уведомить',
  reassign: 'Переназначить',
  page: 'Экстренный вызов',
  close: 'Закрыть',
};

const actionVariants: Record<EscalationRule['action'], 'outline' | 'warning' | 'destructive' | 'secondary'> = {
  notify: 'outline',
  reassign: 'warning',
  page: 'destructive',
  close: 'secondary',
};

function formatSeconds(s: number): string {
  if (s < 60) return `${s}с`;
  if (s < 3600) return `${Math.round(s / 60)}мин`;
  return `${Math.round(s / 3600)}ч`;
}

export default function EscalationRules() {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .order('trigger_after_s', { ascending: true });

      if (error) {
        setError(error.code === '42501' ? 'Нет доступа к правилам эскалации' : error.message);
      } else {
        setRules((data as EscalationRule[]) ?? []);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <AppLayout title="Эскалации">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Правила эскалации инцидентов</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Автоматические действия при превышении SLA таймеров.
            </p>
          </div>
          <button
            onClick={() => alert('TODO: форма создания эскалации')}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить эскалацию
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
            <Bell className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Правила эскалации не настроены</p>
            <p className="text-sm text-muted-foreground mt-1">
              Добавьте правило для автоматической эскалации при нарушении SLA.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Триггер</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действие</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цель</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-warning">{formatSeconds(r.trigger_after_s)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={actionVariants[r.action]}>{actionLabels[r.action]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{r.target_role ?? '—'}</td>
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
