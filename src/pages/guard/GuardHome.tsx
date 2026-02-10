import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, AlertTriangle, ChevronRight, Zap, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GuardMobileLayout from '@/components/guard/GuardMobileLayout';
import { guardShift, guardPatrolRoutes, guardIncidents, guardAlerts } from '@/data/guard-mock-data';
import { cn } from '@/lib/utils';

const shiftStatusLabels: Record<string, string> = {
  scheduled: 'Запланирована',
  active: 'На смене',
  completed: 'Завершена',
  missed: 'Пропущена',
};

const shiftStatusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  scheduled: 'warning',
  active: 'success',
  completed: 'secondary',
  missed: 'destructive',
};

export default function GuardHome() {
  const navigate = useNavigate();
  const shift = guardShift;
  const patrols = guardPatrolRoutes;
  const openIncidents = guardIncidents.filter((i) => !['resolved', 'closed'].includes(i.status));
  const todayPatrolsCount = patrols.length;
  const nextPatrol = patrols.find((p) => p.status === 'not_started' || p.status === 'in_progress');

  const shiftStart = new Date(shift.scheduledStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const shiftEnd = new Date(shift.scheduledEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <GuardMobileLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Shift status card */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Текущая смена</p>
              <p className="mt-1 text-base font-bold text-foreground">{shift.objectName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{shift.postName} · {shiftStart}–{shiftEnd}</p>
            </div>
            <Badge variant={shiftStatusVariant[shift.status]}>{shiftStatusLabels[shift.status]}</Badge>
          </div>

          {shift.status === 'scheduled' && (
            <button
              onClick={() => navigate('/m/guard/shift')}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Play className="h-4 w-4" />
              Начать смену
            </button>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => navigate('/m/guard/patrol')} className="rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/30">
            <MapPin className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{todayPatrolsCount}</p>
            <p className="text-[10px] text-muted-foreground">Обходов</p>
          </button>
          <button onClick={() => navigate('/m/guard/incidents')} className="rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/30">
            <AlertTriangle className="mx-auto h-5 w-5 text-warning mb-1" />
            <p className="text-lg font-bold text-foreground">{openIncidents.length}</p>
            <p className="text-[10px] text-muted-foreground">Открытых</p>
          </button>
          <button onClick={() => navigate('/m/guard/shift')} className="rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/30">
            <Clock className="mx-auto h-5 w-5 text-success mb-1" />
            <p className="text-lg font-bold text-foreground font-mono">
              {shift.actualStart ? new Date(shift.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Начало</p>
          </button>
        </div>

        {/* Quick incident */}
        <button
          onClick={() => navigate('/m/guard/incidents?create=true')}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-destructive/50 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <Zap className="h-5 w-5 text-destructive" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Быстрый инцидент</p>
            <p className="text-xs text-muted-foreground">Создать за один шаг</p>
          </div>
        </button>

        {/* Critical alerts */}
        {guardAlerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Алерты</p>
            {guardAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3 animate-glow-critical" style={{ animationName: alert.severity === 'high' ? undefined : 'none' }}>
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{alert.text}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Next patrol */}
        {nextPatrol && (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Следующий обход</p>
            </div>
            <button
              onClick={() => navigate('/m/guard/patrol')}
              className="flex w-full items-center gap-3 px-4 py-3"
            >
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{nextPatrol.name}</p>
                <p className="text-xs text-muted-foreground">{nextPatrol.checkpoints.length} точек · {nextPatrol.plannedTime}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </GuardMobileLayout>
  );
}
