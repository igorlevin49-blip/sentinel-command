import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  AlertTriangle,
  Target,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { clientObjectData } from '@/data/executive-mock-data';
import { mockIncidents } from '@/data/mock-data';
import type { IncidentStatus } from '@/types/soms';

const statusLabels: Record<IncidentStatus, string> = {
  created: 'Создан',
  accepted: 'Принят',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const statusVariant: Record<IncidentStatus, 'default' | 'warning' | 'destructive' | 'success' | 'secondary'> = {
  created: 'default',
  accepted: 'warning',
  in_progress: 'destructive',
  resolved: 'success',
  closed: 'secondary',
};

export default function ClientDashboard() {
  const d = clientObjectData;

  return (
    <AppLayout title="Обзор объекта">
      {/* Object header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{d.objectName}</h2>
            <div className="mt-1 flex items-center gap-3">
              <Badge variant="success" className="text-xs">Активен</Badge>
              <span className="text-sm text-muted-foreground">Последний обход: {d.lastPatrolTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">SLA выполнение</span>
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-success">{d.slaCompliance}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Охрана на объекте</span>
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-foreground">
            {d.guardsOnDuty}<span className="text-lg text-muted-foreground">/{d.totalGuards}</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">Инциденты (месяц)</span>
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-foreground">{d.incidentsThisMonth}</p>
          <p className="mt-1 text-xs text-muted-foreground">Решено: {d.incidentsResolved}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Активных смен</span>
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-foreground">{d.currentShifts}</p>
        </div>
      </div>

      {/* Incident history */}
      <div className="mt-6 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">История инцидентов</h2>
          </div>
        </div>
        <div className="divide-y divide-border">
          {mockIncidents.slice(0, 5).map((incident) => (
            <div key={incident.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30">
              <div className={`h-2 w-2 rounded-full shrink-0 ${
                incident.priority === 'critical' ? 'bg-destructive' :
                incident.priority === 'high' ? 'bg-warning' :
                'bg-muted-foreground'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{incident.id}</span>
                  <Badge variant={statusVariant[incident.status]} className="text-[10px] px-1.5 py-0">
                    {statusLabels[incident.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm font-medium text-foreground truncate">{incident.title}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {new Date(incident.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SLA compliance banner */}
      <div className="mt-6 rounded-lg border border-success/30 bg-success/5 p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-success" />
          <div>
            <p className="text-sm font-semibold text-foreground">Соответствие SLA</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Объект соответствует SLA на {d.slaCompliance}%. Целевой показатель — 95%.
            </p>
          </div>
          <div className="ml-auto">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
