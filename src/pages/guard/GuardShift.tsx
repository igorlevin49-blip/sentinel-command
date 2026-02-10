import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Play, Square, AlertTriangle, CheckCircle2, Clock, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GuardMobileLayout from '@/components/guard/GuardMobileLayout';
import { guardShift } from '@/data/guard-mock-data';
import { cn } from '@/lib/utils';

const postTypeLabels: Record<string, string> = {
  static: 'Стационарный',
  checkpoint: 'КПП',
  mobile: 'Мобильный',
};

export default function GuardShift() {
  const navigate = useNavigate();
  const [shift, setShift] = useState({ ...guardShift });

  const scheduledStart = new Date(shift.scheduledStart);
  const scheduledEnd = new Date(shift.scheduledEnd);
  const fmtTime = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const fmtDateTime = (s: string) => {
    const d = new Date(s);
    return `${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} ${fmtTime(d)}`;
  };

  const now = new Date();
  const canStart = shift.status === 'scheduled' && Math.abs(now.getTime() - scheduledStart.getTime()) <= 30 * 60 * 1000;
  const canEnd = shift.status === 'active';

  const handleStart = () => {
    setShift((s) => ({ ...s, status: 'active', actualStart: new Date().toISOString(), startLocation: { lat: 55.749, lng: 37.537 } }));
  };

  const handleEnd = () => {
    setShift((s) => ({ ...s, status: 'completed', actualEnd: new Date().toISOString(), endLocation: { lat: 55.749, lng: 37.537 } }));
  };

  const shiftProgress = shift.status === 'active'
    ? Math.min(100, Math.max(0, Math.round(((now.getTime() - scheduledStart.getTime()) / (scheduledEnd.getTime() - scheduledStart.getTime())) * 100)))
    : shift.status === 'completed' ? 100 : 0;

  return (
    <GuardMobileLayout title="Смена">
      <div className="space-y-4 animate-fade-in">
        {/* Status banner */}
        <div className={cn(
          'rounded-xl border p-4',
          shift.status === 'active' ? 'border-success/30 bg-success/5' :
          shift.status === 'completed' ? 'border-border bg-card' :
          'border-warning/30 bg-warning/5'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {shift.status === 'active' && <CheckCircle2 className="h-5 w-5 text-success" />}
              {shift.status === 'scheduled' && <Clock className="h-5 w-5 text-warning" />}
              {shift.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-muted-foreground" />}
              <span className="text-sm font-semibold text-foreground">
                {shift.status === 'active' ? 'Смена активна' : shift.status === 'scheduled' ? 'Смена запланирована' : 'Смена завершена'}
              </span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{shiftProgress}%</span>
          </div>
          {shift.status === 'active' && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: `${shiftProgress}%` }} />
            </div>
          )}
        </div>

        {/* Shift details */}
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{shift.objectName}</p>
              <p className="text-xs text-muted-foreground">{shift.objectAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-foreground">{shift.postName}</p>
              <p className="text-xs text-muted-foreground">{postTypeLabels[shift.postType]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-foreground font-mono">{fmtTime(scheduledStart)} – {fmtTime(scheduledEnd)}</p>
              <p className="text-xs text-muted-foreground">Плановое расписание</p>
            </div>
          </div>
          {shift.actualStart && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Play className="h-4 w-4 text-success shrink-0" />
              <div>
                <p className="text-sm text-foreground">Факт. начало: <span className="font-mono">{fmtDateTime(shift.actualStart)}</span></p>
              </div>
            </div>
          )}
          {shift.actualEnd && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Square className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-foreground">Факт. конец: <span className="font-mono">{fmtDateTime(shift.actualEnd)}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Supervisor */}
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Старший смены</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{shift.supervisorName}</p>
            <a
              href={`tel:${shift.supervisorPhone}`}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Phone className="h-3.5 w-3.5" />
              Позвонить
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {canStart && (
            <button
              onClick={handleStart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90"
            >
              <Play className="h-4 w-4" />
              Начать смену
            </button>
          )}
          {canEnd && (
            <button
              onClick={handleEnd}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80"
            >
              <Square className="h-4 w-4" />
              Завершить смену
            </button>
          )}
          {shift.status === 'active' && (
            <button
              onClick={() => navigate('/m/guard/incidents?create=true')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              <AlertTriangle className="h-4 w-4" />
              Сообщить о нарушении
            </button>
          )}
        </div>
      </div>
    </GuardMobileLayout>
  );
}
