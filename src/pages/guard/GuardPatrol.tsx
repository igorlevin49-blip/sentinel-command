import { useState } from 'react';
import { CheckCircle2, Circle, Play, ChevronDown, ChevronUp, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GuardMobileLayout from '@/components/guard/GuardMobileLayout';
import { guardPatrolRoutes, guardPatrolHistory, type PatrolRoute, type PatrolCheckpoint } from '@/data/guard-mock-data';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  not_started: 'Не начат',
  in_progress: 'В процессе',
  completed: 'Завершён',
  overdue: 'Просрочен',
};

const statusVariant: Record<string, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  not_started: 'secondary',
  in_progress: 'warning',
  completed: 'success',
  overdue: 'destructive',
};

export default function GuardPatrol() {
  const [routes, setRoutes] = useState<PatrolRoute[]>(() => JSON.parse(JSON.stringify(guardPatrolRoutes)));
  const [expandedRoute, setExpandedRoute] = useState<string | null>(routes.find((r) => r.status === 'in_progress')?.id ?? null);
  const [deviationFor, setDeviationFor] = useState<string | null>(null);
  const [deviationReason, setDeviationReason] = useState('');

  const handleStartPatrol = (routeId: string) => {
    setRoutes((prev) =>
      prev.map((r) => r.id === routeId ? { ...r, status: 'in_progress' as const } : r)
    );
    setExpandedRoute(routeId);
  };

  const handleConfirmCheckpoint = (routeId: string, cpId: string) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        const updated = r.checkpoints.map((cp) =>
          cp.id === cpId
            ? { ...cp, completed: true, completedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), location: { lat: 55.749, lng: 37.537 } }
            : cp
        );
        const allDone = updated.every((cp) => cp.completed);
        return { ...r, checkpoints: updated, status: allDone ? 'completed' as const : r.status };
      })
    );
  };

  const getNextCheckpointIndex = (route: PatrolRoute) => {
    return route.checkpoints.findIndex((cp) => !cp.completed);
  };

  return (
    <GuardMobileLayout title="Обход">
      <div className="space-y-4 animate-fade-in">
        {/* Route list */}
        {routes.map((route) => {
          const completed = route.checkpoints.filter((c) => c.completed).length;
          const total = route.checkpoints.length;
          const progress = Math.round((completed / total) * 100);
          const isExpanded = expandedRoute === route.id;
          const nextIdx = getNextCheckpointIndex(route);

          return (
            <div key={route.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Route header */}
              <button
                onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                className="flex w-full items-center gap-3 px-4 py-3"
              >
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{route.name}</p>
                    <Badge variant={statusVariant[route.status]} className="text-[10px]">{statusLabels[route.status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completed}/{total} точек · {route.plannedTime} · {route.frequency}
                  </p>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {/* Progress bar */}
              {route.status !== 'not_started' && (
                <div className="px-4 pb-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {/* Expanded: checkpoints */}
              {isExpanded && (
                <div className="border-t border-border">
                  {route.status === 'not_started' && (
                    <div className="p-4">
                      <button
                        onClick={() => handleStartPatrol(route.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Play className="h-4 w-4" />
                        Начать обход
                      </button>
                    </div>
                  )}

                  {route.status !== 'not_started' && route.checkpoints.map((cp, i) => (
                    <div
                      key={cp.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 border-b border-border last:border-0',
                        cp.completed && 'bg-success/5'
                      )}
                    >
                      {cp.completed ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                      ) : (
                        <Circle className={cn('h-5 w-5 shrink-0', i === nextIdx ? 'text-primary' : 'text-muted-foreground')} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', cp.completed ? 'text-success' : 'text-foreground')}>{cp.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cp.completedAt ? `Отмечено: ${cp.completedAt}` : cp.expectedTimeWindow}
                          {cp.code && <span className="ml-2 text-muted-foreground/60">#{cp.code}</span>}
                        </p>
                      </div>
                      {!cp.completed && i === nextIdx && route.status === 'in_progress' && (
                        <button
                          onClick={() => handleConfirmCheckpoint(route.id, cp.id)}
                          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          Отметить
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* History */}
        {guardPatrolHistory.length > 0 && (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">История обходов</p>
            </div>
            {guardPatrolHistory.map((run) => (
              <div key={run.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{run.routeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {run.checkpointsCompleted}/{run.checkpointsTotal} точек
                    {run.deviations > 0 && <span className="text-warning ml-1">· {run.deviations} откл.</span>}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(run.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </GuardMobileLayout>
  );
}
