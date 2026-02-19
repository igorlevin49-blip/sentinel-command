import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  org_id: string | null;
  user_id: string | null;
  created_at: string;
}

export default function SuperAdminAudit() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      setError(error.code === '42501' ? 'Нет доступа к журналу аудита' : error.message);
    } else {
      setEntries((data as AuditEntry[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  return (
    <AppLayout title="Аудит / Журнал">
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Журнал действий платформы</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Все аудируемые события по организациям и платформенным операциям.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Журнал пуст</p>
            <p className="text-sm text-muted-foreground mt-1">Аудируемых событий пока нет.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действие</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Сущность</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Org ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Время</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{e.action}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {e.entity_type ?? '—'}{e.entity_id ? ` / ${e.entity_id.slice(0, 8)}…` : ''}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {e.user_id ? `${e.user_id.slice(0, 8)}…` : '—'}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {e.org_id ? `${e.org_id.slice(0, 8)}…` : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString('ru', { dateStyle: 'short', timeStyle: 'short' })}
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
