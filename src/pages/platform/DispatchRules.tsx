import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Route, Plus } from 'lucide-react';

interface DispatchRule {
  id: string;
  org_id: string;
  name: string;
  priority: number;
  condition_json: Record<string, unknown> | null;
  action_json: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export default function DispatchRules() {
  const [rules, setRules] = useState<DispatchRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('dispatch_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) {
        setError(error.code === '42501' ? 'Нет доступа к правилам маршрутизации' : error.message);
      } else {
        setRules((data as DispatchRule[]) ?? []);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <AppLayout title="Правила маршрутизации">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Правила диспетчеризации</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Автоматическая маршрутизация инцидентов по условиям (зона, тип, приоритет).
            </p>
          </div>
          <button
            onClick={() => alert('TODO: форма создания правила')}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить правило
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
            <Route className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Правила маршрутизации не настроены</p>
            <p className="text-sm text-muted-foreground mt-1">
              Добавьте первое правило чтобы автоматизировать диспетчеризацию.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      P{r.priority}
                    </span>
                    <h3 className="font-medium text-foreground text-sm">{r.name}</h3>
                  </div>
                  <Badge variant={r.is_active ? 'success' : 'secondary'}>
                    {r.is_active ? 'Активно' : 'Откл.'}
                  </Badge>
                </div>
                {r.condition_json && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Условие:</span>{' '}
                    <code className="bg-muted rounded px-1 py-0.5">{JSON.stringify(r.condition_json)}</code>
                  </div>
                )}
                {r.action_json && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">Действие:</span>{' '}
                    <code className="bg-muted rounded px-1 py-0.5">{JSON.stringify(r.action_json)}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
