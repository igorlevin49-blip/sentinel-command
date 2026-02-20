import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useOrgIncident, useIncidentEvents, useOrgPersonnel } from '@/hooks/use-org-data';
import { useActiveOrg } from '@/contexts/ActiveOrgContext';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, ChevronLeft, Loader2, User, Clock, MessageSquare,
  CheckCircle2, ArrowRight, Shield, Send
} from 'lucide-react';

const sevLabels: Record<string, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
};
const sevVariant: Record<string, any> = {
  low: 'success', medium: 'warning', high: 'destructive', critical: 'destructive',
};
const statusLabels: Record<string, string> = {
  created: 'Создан', accepted: 'Принят', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт',
};
const typeLabels: Record<string, string> = {
  alarm: 'Тревога', violation: 'Нарушение', event: 'Событие', fraud: 'Мошенничество',
};

// State machine: role → allowed transitions from current status
type IncidentStatus = 'created' | 'accepted' | 'in_progress' | 'resolved' | 'closed';

const TRANSITIONS: Record<string, Record<string, string[]>> = {
  org_admin:   { created: ['accepted', 'in_progress'], accepted: ['in_progress', 'closed'], in_progress: ['resolved'], resolved: ['closed'] },
  dispatcher:  { created: ['accepted'], accepted: ['in_progress'], in_progress: ['resolved'], resolved: ['closed'] },
  chief:       { in_progress: ['resolved'], resolved: ['closed'] },
  guard:       { accepted: ['in_progress'], in_progress: ['resolved'] },
  super_admin: { created: ['accepted', 'in_progress'], accepted: ['in_progress', 'closed'], in_progress: ['resolved'], resolved: ['closed'] },
};

// Timestamps to update on transition
const STATUS_TIMESTAMPS: Record<string, string> = {
  accepted: 'accepted_at',
  in_progress: 'en_route_at',
  resolved: 'resolved_at',
  closed: 'closed_at',
};

const STATUS_TS_LABELS: Record<string, string> = {
  created: 'Создан', accepted: 'Принят', in_progress: 'В работе',
  resolved: 'Решён', closed: 'Закрыт',
};

function EventIcon({ type }: { type: string }) {
  if (type === 'comment') return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  if (type === 'assigned') return <User className="h-4 w-4 text-primary" />;
  if (type === 'status_changed') return <ArrowRight className="h-4 w-4 text-warning" />;
  if (type === 'created') return <AlertTriangle className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function eventLabel(ev: any): string {
  if (ev.event_type === 'comment') return ev.payload_json?.text ?? '';
  if (ev.event_type === 'created') return `Инцидент создан: ${ev.payload_json?.title ?? ''}`;
  if (ev.event_type === 'assigned') return `Назначен исполнитель`;
  if (ev.event_type === 'status_changed') {
    const from = statusLabels[ev.payload_json?.from] ?? ev.payload_json?.from ?? '';
    const to = statusLabels[ev.payload_json?.to] ?? ev.payload_json?.to ?? '';
    return `Статус изменён: ${from} → ${to}`;
  }
  return ev.event_type;
}

export default function IncidentDetails() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { orgId, canDispatch } = useActiveOrg();
  const { role } = useRole();
  const { user } = useAuth();
  const { data: incident, isLoading, error } = useOrgIncident(id);
  const { data: events, isLoading: evLoading } = useIncidentEvents(id);
  const { data: personnel } = useOrgPersonnel();
  const [comment, setComment] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const allowedTransitions = incident && role
    ? (TRANSITIONS[role]?.[incident.status] ?? [])
    : [];

  async function handleTransition(newStatus: string) {
    if (!incident || !orgId || !user) return;
    setTransitioning(true);
    setActionError(null);
    const tsField = STATUS_TIMESTAMPS[newStatus];
    const updates: Record<string, any> = { status: newStatus as any };
    if (tsField) updates[tsField] = new Date().toISOString();
    const { error: err } = await supabase.from('incidents').update(updates).eq('id', incident.id);
    if (err) {
      setActionError(err.code === '42501' ? 'Нет доступа' : err.message);
      setTransitioning(false);
      return;
    }
    await supabase.from('incident_events').insert({
      incident_id: incident.id,
      org_id: orgId,
      actor_user_id: user.id,
      event_type: 'status_changed',
      payload_json: { from: incident.status, to: newStatus },
    });
    setTransitioning(false);
    qc.invalidateQueries({ queryKey: ['org-incident', id] });
    qc.invalidateQueries({ queryKey: ['incident-events', id] });
    qc.invalidateQueries({ queryKey: ['org-incidents'] });
  }

  async function handleAssign() {
    if (!incident || !orgId || !user || !assignTo) return;
    setTransitioning(true);
    setActionError(null);
    const { error: err } = await supabase.from('incidents').update({
      assigned_to_personnel_id: assignTo,
    } as any).eq('id', incident.id);
    if (err) {
      setActionError(err.code === '42501' ? 'Нет доступа' : err.message);
      setTransitioning(false);
      return;
    }
    await supabase.from('incident_events').insert({
      incident_id: incident.id,
      org_id: orgId,
      actor_user_id: user.id,
      event_type: 'assigned',
      payload_json: { assigned_to_personnel_id: assignTo },
    });
    setTransitioning(false);
    setAssignTo('');
    qc.invalidateQueries({ queryKey: ['org-incident', id] });
    qc.invalidateQueries({ queryKey: ['incident-events', id] });
  }

  async function handleComment() {
    if (!comment.trim() || !incident || !orgId || !user) return;
    const { error: err } = await supabase.from('incident_events').insert({
      incident_id: incident.id,
      org_id: orgId,
      actor_user_id: user.id,
      event_type: 'comment',
      payload_json: { text: comment.trim() },
    });
    if (err) setActionError(err.code === '42501' ? 'Нет доступа' : err.message);
    else {
      setComment('');
      qc.invalidateQueries({ queryKey: ['incident-events', id] });
    }
  }

  return (
    <AppLayout title="Карточка инцидента">
      <div className="mb-4">
        <Link to="/incidents" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Все инциденты
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : error ? (
        <ErrorDisplay error={error} />
      ) : !incident ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Инцидент не найден</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info + timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 shrink-0">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-foreground">{incident.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant={sevVariant[incident.severity]}>{sevLabels[incident.severity]}</Badge>
                    <Badge variant="outline">{typeLabels[incident.type] ?? incident.type}</Badge>
                    <Badge variant="secondary">{statusLabels[incident.status] ?? incident.status}</Badge>
                  </div>
                </div>
              </div>
              {incident.description && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{incident.description}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Timeline</h2>
              {evLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : (events ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">События отсутствуют</p>
              ) : (
                <div className="space-y-3">
                  {(events ?? []).map(ev => (
                    <div key={ev.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted shrink-0">
                        <EventIcon type={ev.event_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{eventLabel(ev)}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {new Date(ev.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment form */}
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                    rows={2}
                    placeholder="Добавить комментарий..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={!comment.trim()}
                    className="shrink-0 h-auto"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: meta + actions */}
          <div className="space-y-4">
            {/* Meta */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Детали</h2>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Объект</p>
                <p className="text-sm font-medium">{(incident as any).objects?.name ?? '—'}</p>
              </div>
              {/* Post info removed — incidents table has no post_id FK */}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Назначен</p>
                <p className="text-sm font-medium">{(incident as any).personnel?.full_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Создан</p>
                <p className="text-sm font-mono">{new Date(incident.created_at).toLocaleString('ru-RU')}</p>
              </div>
              {incident.accepted_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Принят</p>
                  <p className="text-sm font-mono">{new Date(incident.accepted_at).toLocaleString('ru-RU')}</p>
                </div>
              )}
              {(incident as any).resolved_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Решён</p>
                  <p className="text-sm font-mono">{new Date((incident as any).resolved_at).toLocaleString('ru-RU')}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {(allowedTransitions.length > 0 || canDispatch) && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Действия</h2>

                {/* Status transitions */}
                {allowedTransitions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Изменить статус:</p>
                    {allowedTransitions.map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => handleTransition(s)}
                        disabled={transitioning}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        → {statusLabels[s] ?? s}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Assign */}
                {canDispatch && incident.status !== 'closed' && incident.status !== 'resolved' && (
                  <div className="pt-2 border-t border-border space-y-2">
                    <p className="text-xs text-muted-foreground">Назначить исполнителя:</p>
                    <select
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      value={assignTo}
                      onChange={e => setAssignTo(e.target.value)}
                    >
                      <option value="">— выберите охранника —</option>
                      {(personnel ?? []).filter(p => p.is_active).map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleAssign}
                      disabled={!assignTo || transitioning}
                    >
                      <Shield className="h-4 w-4" /> Назначить
                    </Button>
                  </div>
                )}

                {actionError && <ErrorDisplay error={actionError} />}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
