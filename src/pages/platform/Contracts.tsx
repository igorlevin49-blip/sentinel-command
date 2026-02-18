import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus } from 'lucide-react';

interface Contract {
  id: string;
  org_id: string;
  customer_org_id: string | null;
  title: string;
  number: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'active' | 'suspended' | 'terminated';
  created_at: string;
}

const statusLabels: Record<Contract['status'], string> = {
  draft: 'Черновик',
  active: 'Активен',
  suspended: 'Приостановлен',
  terminated: 'Расторгнут',
};

const statusVariants: Record<Contract['status'], 'outline' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  draft: 'secondary',
  active: 'success',
  suspended: 'warning',
  terminated: 'destructive',
};

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.code === '42501' ? 'Нет доступа к контрактам' : error.message);
      } else {
        setContracts((data as Contract[]) ?? []);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <AppLayout title="Контракты">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Контракты с заказчиками</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Договоры между организациями и заказчиками.</p>
          </div>
          <button
            onClick={() => alert('TODO: форма создания контракта')}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Новый контракт
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
        ) : contracts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Контракты не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">Нажмите «Новый контракт» чтобы добавить первый.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Номер</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Начало</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Окончание</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.number ?? '—'}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{c.title}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariants[c.status]}>{statusLabels[c.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {c.start_date ? new Date(c.start_date).toLocaleDateString('ru') : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {c.end_date ? new Date(c.end_date).toLocaleDateString('ru') : '—'}
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
