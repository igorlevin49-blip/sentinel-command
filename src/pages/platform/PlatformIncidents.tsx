import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Filter } from 'lucide-react';
import { useDrawerState } from '@/hooks/useDrawerState';

type IncidentStatus = 'created' | 'accepted' | 'in_progress' | 'resolved' | 'closed';
type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
type IncidentType = 'alarm' | 'violation' | 'event' | 'fraud';

interface Incident {
  id: string; org_id: string; title: string; type: IncidentType; severity: IncidentSeverity;
  status: IncidentStatus; description: string | null; assigned_to: string | null;
  object_id: string | null; created_at: string; updated_at: string;
}

const statusLabels: Record<IncidentStatus, string> = { created: 'Создан', accepted: 'Принят', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт' };
const statusVariants: Record<IncidentStatus, 'secondary' | 'warning' | 'outline' | 'success' | 'destructive'> = { created: 'secondary', accepted: 'warning', in_progress: 'outline', resolved: 'success', closed: 'secondary' };
const statusFlow: Record<IncidentStatus, IncidentStatus | null> = { created: 'accepted', accepted: 'in_progress', in_progress: 'resolved', resolved: 'closed', closed: null };
const severityLabels: Record<IncidentSeverity, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический' };
const severityVariants: Record<IncidentSeverity, 'secondary' | 'warning' | 'outline' | 'success' | 'destructive'> = { low: 'secondary', medium: 'warning', high: 'outline', critical: 'destructive' };
const typeLabels: Record<IncidentType, string> = { alarm: 'Тревога', violation: 'Нарушение', event: 'Событие', fraud: 'Мошенничество' };

const STATUS_OPTIONS: (IncidentStatus | '')[] = ['', 'created', 'accepted', 'in_progress', 'resolved', 'closed'];
const SEVERITY_OPTIONS: (IncidentSeverity | '')[] = ['', 'low', 'medium', 'high', 'critical'];
const TYPE_OPTIONS: (IncidentType | '')[] = ['', 'alarm', 'violation', 'event', 'fraud'];

export default function PlatformIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | ''>('');
  const [filterType, setFilterType] = useState<IncidentType | ''>('');

  // URL-synced detail panel
  const { isOpen: detailOpen, openId: selectedId, open: openDetail, close: closeDetail } = useDrawerState('incident');
  const [assignTo, setAssignTo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(200);
    if (filterStatus) query = query.eq('status', filterStatus);
    if (filterSeverity) query = query.eq('severity', filterSeverity);
    if (filterType) query = query.eq('type', filterType);
    const { data, error } = await query;
    if (error) setError(error.code === '42501' ? 'Нет доступа к инцидентам' : error.message);
    else { setIncidents((data as Incident[]) ?? []); setError(null); }
    setLoading(false);
  }, [filterStatus, filterSeverity, filterType]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const selected = incidents.find(i => i.id === selectedId) ?? null;

  // Restore assignTo when selected changes
  useEffect(() => { if (selected) setAssignTo(selected.assigned_to ?? ''); }, [selected]);

  async function advanceStatus(inc: Incident) {
    const next = statusFlow[inc.status];
    if (!next) return;
    setActionLoading(true); setActionError(null);
    const update: Record<string, string> = { status: next };
    if (next === 'accepted') update['accepted_at'] = new Date().toISOString();
    if (next === 'resolved') update['resolved_at'] = new Date().toISOString();
    if (next === 'closed') update['closed_at'] = new Date().toISOString();
    const { error } = await supabase.from('incidents').update(update).eq('id', inc.id);
    if (error) setActionError(error.code === '42501' ? 'Нет прав для изменения статуса' : error.message);
    else { closeDetail(); fetchIncidents(); }
    setActionLoading(false);
  }

  async function handleAssign(inc: Incident) {
    if (!assignTo.trim()) { setActionError('Введите assigned_to'); return; }
    setActionLoading(true); setActionError(null);
    const { error } = await supabase.from('incidents').update({ assigned_to: assignTo.trim() }).eq('id', inc.id);
    if (error) setActionError(error.code === '42501' ? 'Нет прав для назначения' : error.message);
    else { setAssignTo(''); closeDetail(); fetchIncidents(); }
    setActionLoading(false);
  }

  const filterActive = filterStatus || filterSeverity || filterType;

  return (
    <AppLayout title="Очередь ЦОУ — Инциденты">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Все инциденты платформы</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Кросс-организационная очередь ЦОУ. Доступно по platform_role.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as IncidentStatus | '')}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? statusLabels[s] : 'Все статусы'}</option>)}
            </select>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as IncidentSeverity | '')}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
              {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s ? severityLabels[s] : 'Все приоритеты'}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as IncidentType | '')}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t ? typeLabels[t] : 'Все типы'}</option>)}
            </select>
            {filterActive && (
              <button onClick={() => { setFilterStatus(''); setFilterSeverity(''); setFilterType(''); }}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors">
                Сбросить
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3" /><p className="text-muted-foreground">{error}</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Инцидентов не найдено</p>
            <p className="text-sm text-muted-foreground mt-1">{filterActive ? 'Попробуйте изменить фильтры.' : 'Очередь пуста.'}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Инцидент</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тип</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Приоритет</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Назначен</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Создан</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div><p className="font-medium text-foreground text-sm">{inc.title}</p><p className="text-xs text-muted-foreground font-mono">{inc.org_id.slice(0, 8)}…</p></div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{typeLabels[inc.type]}</td>
                    <td className="px-4 py-3"><Badge variant={severityVariants[inc.severity]}>{severityLabels[inc.severity]}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={statusVariants[inc.status]}>{statusLabels[inc.status]}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inc.assigned_to ? <span className="font-mono">{inc.assigned_to.slice(0, 8)}…</span> : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(inc.created_at).toLocaleString('ru', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { openDetail(inc.id); setActionError(null); }}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">Детали</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail / Action panel */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div><h3 className="font-semibold text-foreground">{selected.title}</h3><p className="text-xs text-muted-foreground mt-0.5 font-mono">{selected.id}</p></div>
                <button onClick={closeDetail} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Статус:</span> <Badge variant={statusVariants[selected.status]} className="ml-1">{statusLabels[selected.status]}</Badge></div>
                <div><span className="text-muted-foreground">Приоритет:</span> <Badge variant={severityVariants[selected.severity]} className="ml-1">{severityLabels[selected.severity]}</Badge></div>
                <div><span className="text-muted-foreground">Тип:</span> <span className="text-foreground ml-1">{typeLabels[selected.type]}</span></div>
                <div><span className="text-muted-foreground">Org:</span> <span className="font-mono text-foreground ml-1">{selected.org_id.slice(0, 12)}…</span></div>
              </div>
              {selected.description && <p className="text-xs text-muted-foreground bg-muted rounded p-2">{selected.description}</p>}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Назначить (assigned_to — UUID персонала)</label>
                <div className="flex gap-2">
                  <input value={assignTo} onChange={(e) => setAssignTo(e.target.value)} placeholder="UUID персонала…"
                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button onClick={() => handleAssign(selected)} disabled={actionLoading}
                    className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">Назначить</button>
                </div>
              </div>
              {statusFlow[selected.status] && (
                <button onClick={() => advanceStatus(selected)} disabled={actionLoading}
                  className="w-full rounded-md border border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors">
                  {actionLoading ? 'Обновление…' : `Перевести в "${statusLabels[statusFlow[selected.status]!]}"`}
                </button>
              )}
              {actionError && <p className="text-xs text-destructive">{actionError}</p>}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
