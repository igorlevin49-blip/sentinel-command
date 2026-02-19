import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SecurityObject {
  id: string;
  name: string;
  address: string | null;
  org_id: string;
  risk_level: string;
  is_active: boolean;
  created_at: string;
}

const riskLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

const riskVariants: Record<string, 'secondary' | 'warning' | 'outline' | 'destructive'> = {
  low: 'secondary',
  medium: 'warning',
  high: 'outline',
  critical: 'destructive',
};

export default function SuperAdminObjects() {
  const [objects, setObjects] = useState<SecurityObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchObjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      setError(error.code === '42501' ? 'Нет доступа к объектам' : error.message);
    } else {
      setObjects((data as SecurityObject[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchObjects(); }, [fetchObjects]);

  return (
    <AppLayout title="Объекты">
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Все объекты охраны</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Кросс-организационный реестр охраняемых объектов платформы.
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
        ) : objects.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Объекты не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">В системе ещё нет охраняемых объектов.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Объект</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Адрес</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Риск</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Org ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {objects.map((obj) => (
                  <tr key={obj.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{obj.name}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{obj.address ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge variant={riskVariants[obj.risk_level] ?? 'secondary'}>
                        {riskLabels[obj.risk_level] ?? obj.risk_level}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={obj.is_active ? 'success' : 'secondary'}>
                        {obj.is_active ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground" title={obj.org_id}>
                      {obj.org_id.slice(0, 8)}…
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
