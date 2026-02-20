import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Filter, Clock } from 'lucide-react';
import { useDrawerState } from '@/hooks/useDrawerState';
import { toast } from 'sonner';

/* ── Types ── */
type IncidentStatus = 'created' | 'accepted' | 'in_progress' | 'resolved' | 'closed';
type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
type IncidentType = 'alarm' | 'violation' | 'event' | 'fraud';

interface Incident {
  id: string;
  org_id: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string | null;
  assigned_to: string | null;
  object_id: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  en_route_at: string | null;
  on_site_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
}

/* ── Labels & Variants ── */
const statusLabels: Record<IncidentStatus, string> = {
  created: 'Создан', accepted: 'Принят', in_progress: 'В работе',
  resolved: 'Решён', closed: 'Закрыт',
};
const statusVariants: Record<IncidentStatus, 'secondary' | 'warning' | 'outline' | 'success' | 'destructive'> = {
  created: 'secondary', accepted: 'warning', in_progress: 'outline',
  resolved: 'success', closed: 'secondary',
};
const severityLabels: Record<IncidentSeverity, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
};
const severityVariants: Record<IncidentSeverity, 'secondary' | 'warning' | 'outline' | 'success' | 'destructive'> = {
  low: 'secondary', medium: 'warning', high: 'outline', critical: 'destructive',
};
const typeLabels: Record<IncidentType, string> = {
  alarm: 'Тревога', violation: 'Нарушение', event: 'Событие', fraud: 'Мошенничество',
};

/* ── Platform-specific transition rules (NOT org TRANSITIONS) ── */
const PLATFORM_ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  created: ['accepted'],
  accepted: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['closed'],
  closed: [],
};

/** Map status → which timestamp(s) to set */
const TIMESTAMP_FOR_STATUS: Partial<Record<IncidentStatus, string[]>> = {
  accepted: ['accepted_at'],
  in_progress: ['en_route_at'],
  resolved: ['resolved_at'],
  closed: ['closed_at'],
};

const transitionLabels: Record<IncidentStatus, string> = {
  created: 'Создать', // unused as target
  accepted: 'Принять',
  in_progress: 'В пути',
  resolved: 'Решить',
  closed: 'Закрыть',
};

/* ── Filter options ── */
const STATUS_OPTIONS: (IncidentStatus | '')[] = ['', 'created', 'accepted', 'in_progress', 'resolved', 'closed'];
const SEVERITY_OPTIONS: (IncidentSeverity | '')[] = ['', 'low', 'medium', 'high', 'critical'];
const TYPE_OPTIONS: (IncidentType | '')[] = ['', 'alarm', 'violation', 'event', 'fraud'];

/* ── Helpers ── */
function isRlsDenied(err: { code?: string; message?: string }): boolean {
  return err.code === '42501' || (err.message?.toLowerCase().includes('permission denied') ?? false);
}

function formatTs(val: string | null): string {
  if (!val) return '—';
  return new Date(val).toLocaleString('ru', { dateStyle: 'short', timeStyle: 'short' });
}

/* ── Component ── */
export default function PlatformIncidents() {
  const { isPlatformDispatcher, isPlatformAdmin, isPlatformSA } = usePlatformAuth();
  const canAct = isPlatformDispatcher || isPlatformAdmin || isPlatformSA;

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | ''>('');
  const [filterType, setFilterType] = useState<IncidentType | ''>('');

  const { openId: selectedId, open: openDetail, close: closeDetail } = useDrawerState('incident');
  const [assignTo, setAssignTo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('incidents')
      .select('id,org_id,title,type,severity,status,description,assigned_to,object_id,created_at,updated_at,accepted_at,en_route_at,on_site_at,resolved_at,closed_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filterStatus) query = query.eq('status', filterStatus);
    if (filterSeverity) query = query.eq('severity', filterSeverity);
    if (filterType) query = query.eq('type', filterType);
    const { data, error: err } = await query;
    if (err) {
      setError(isRlsDenied(err) ? 'Нет доступа к инцидентам (RLS)' : err.message);
    } else {
      setIncidents((data as Incident[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [filterStatus, filterSeverity, filterType]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const selected = incidents.find(i => i.id === selectedId) ?? null;
  useEffect(() => { if (selected) setAssignTo(selected.assigned_to ?? ''); }, [selected]);

  /* ── Actions ── */
  async function transitionTo(inc: Incident, nextStatus: IncidentStatus) {
    setActionLoading(true);
    setActionError(null);
    const update: Record<string, string> = { status: nextStatus };
    const tsFields = TIMESTAMP_FOR_STATUS[nextStatus];
    if (tsFields) {
      const now = new Date().toISOString();
      tsFields.forEach((f) => { update[f] = now; });
    }

    const { error: err } = await supabase.from('incidents').update(update).eq('id', inc.id);
    if (err) {
      const msg = isRlsDenied(err) ? 'Нет доступа (RLS) — обновление запрещено' : err.message;
      setActionError(msg);
      toast.error(msg);
    } else {
      toast.success(`Статус изменён → ${statusLabels[nextStatus]}`);
      closeDetail();
      fetchIncidents();
    }
    setActionLoading(false);
  }

  async function handleAssign(inc: Incident) {
    if (!assignTo.trim()) { setActionError('Введите UUID персонала'); return; }
    setActionLoading(true);
    setActionError(null);
    const { error: err } = await supabase.from('incidents').update({ assigned_to: assignTo.trim() }).eq('id', inc.id);
    if (err) {
      const msg = isRlsDenied(err) ? 'Нет доступа (RLS) — назначение запрещено' : err.message;
      setActionError(msg);
      toast.error(msg);
    } else {
      toast.success('Ответственный назначен');
      closeDetail();
      fetchIncidents();
    }
    setActionLoading(false);
  }

  const filterActive = filterStatus || filterSeverity || filterType;
  const nextStatuses = selected ? PLATFORM_ALLOWED_TRANSITIONS[selected.status] : [];

  return (
    <AppLayout title="Очередь ЦОУ — Инциденты">
      <div className="space-y-5">
        {/* ── Header + Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Все инциденты платформы</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Кросс-организационная очередь ЦОУ. {canAct ? 'Вы можете менять статусы.' : 'Только просмотр.'}
            </p>
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

        {/* ── Table ── */}
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
                      <div>
                        <p className="font-medium text-foreground text-sm">{inc.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{inc.org_id.slice(0, 8)}…</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{typeLabels[inc.type]}</td>
                    <td className="px-4 py-3"><Badge variant={severityVariants[inc.severity]}>{severityLabels[inc.severity]}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={statusVariants[inc.status]}>{statusLabels[inc.status]}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inc.assigned_to ? <span className="font-mono">{inc.assigned_to.slice(0, 8)}…</span> : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatTs(inc.created_at)}</td>
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

        {/* ── Detail / Action panel (modal) ── */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={closeDetail}>
            <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{selected.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{selected.id}</p>
                </div>
                <button onClick={closeDetail} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Статус:</span> <Badge variant={statusVariants[selected.status]} className="ml-1">{statusLabels[selected.status]}</Badge></div>
                <div><span className="text-muted-foreground">Приоритет:</span> <Badge variant={severityVariants[selected.severity]} className="ml-1">{severityLabels[selected.severity]}</Badge></div>
                <div><span className="text-muted-foreground">Тип:</span> <span className="text-foreground ml-1">{typeLabels[selected.type]}</span></div>
                <div><span className="text-muted-foreground">Org:</span> <span className="font-mono text-foreground ml-1">{selected.org_id.slice(0, 12)}…</span></div>
              </div>

              {/* Description */}
              {selected.description && <p className="text-xs text-muted-foreground bg-muted rounded p-2">{selected.description}</p>}

              {/* Timestamps */}
              <div className="rounded-md border border-border p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Хронология
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Создан:</span><span className="text-foreground">{formatTs(selected.created_at)}</span>
                  <span className="text-muted-foreground">Принят:</span><span className="text-foreground">{formatTs(selected.accepted_at)}</span>
                  <span className="text-muted-foreground">В пути:</span><span className="text-foreground">{formatTs(selected.en_route_at)}</span>
                  <span className="text-muted-foreground">На месте:</span><span className="text-foreground">{formatTs(selected.on_site_at)}</span>
                  <span className="text-muted-foreground">Решён:</span><span className="text-foreground">{formatTs(selected.resolved_at)}</span>
                  <span className="text-muted-foreground">Закрыт:</span><span className="text-foreground">{formatTs(selected.closed_at)}</span>
                </div>
              </div>

              {/* Assign (only if can act) */}
              {canAct && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Назначить (assigned_to — UUID)</label>
                  <div className="flex gap-2">
                    <input value={assignTo} onChange={(e) => setAssignTo(e.target.value)} placeholder="UUID персонала…"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button onClick={() => handleAssign(selected)} disabled={actionLoading}
                      className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      Назначить
                    </button>
                  </div>
                </div>
              )}

              {/* Transition buttons */}
              {canAct && nextStatuses.length > 0 && (
                <div className="flex flex-col gap-2">
                  {nextStatuses.map((next) => (
                    <button
                      key={next}
                      onClick={() => transitionTo(selected, next)}
                      disabled={actionLoading}
                      className="w-full rounded-md border border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading ? 'Обновление…' : transitionLabels[next]}
                    </button>
                  ))}
                </div>
              )}

              {/* Read-only notice for director */}
              {!canAct && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Только просмотр. Для управления инцидентами необходима роль dispatcher, admin или super_admin.
                </p>
              )}

              {actionError && <p className="text-xs text-destructive">{actionError}</p>}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
