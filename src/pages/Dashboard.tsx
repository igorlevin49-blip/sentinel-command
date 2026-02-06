import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  Route,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
} from 'lucide-react';
import {
  dashboardStats,
  mockIncidents,
  mockShifts,
  mockPatrols,
  weeklyData,
} from '@/data/mock-data';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { IncidentStatus, IncidentType } from '@/types/soms';

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

const typeLabels: Record<IncidentType, string> = {
  alarm: 'Тревога',
  violation: 'Нарушение',
  event: 'Событие',
};

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  accent = 'primary',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  accent?: 'primary' | 'success' | 'destructive' | 'warning';
}) {
  const accentClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="font-mono text-3xl font-bold text-foreground">{value}</span>
        {trend && (
          <span className={`flex items-center text-xs font-medium ${trendUp ? 'text-success' : 'text-destructive'}`}>
            {trendUp ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export default function Dashboard() {
  const openIncidents = mockIncidents.filter(
    (i) => i.status !== 'closed' && i.status !== 'resolved'
  );

  return (
    <AppLayout title="Оперативный дашборд">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Активные объекты"
          value={dashboardStats.activeObjects}
          icon={Building2}
          trend="+2 за месяц"
          trendUp
          accent="primary"
        />
        <StatCard
          title="На смене"
          value={dashboardStats.onDutyPersonnel}
          icon={Users}
          trend="92% укомпл."
          trendUp
          accent="success"
        />
        <StatCard
          title="Открытые инциденты"
          value={dashboardStats.openIncidents}
          icon={AlertTriangle}
          trend="-1 к вчера"
          trendUp
          accent={dashboardStats.openIncidents > 5 ? 'destructive' : 'warning'}
        />
        <StatCard
          title="SLA выполнение"
          value={`${dashboardStats.slaCompliance}%`}
          icon={TrendingUp}
          trend="+1.2%"
          trendUp
          accent="success"
        />
      </div>

      {/* Main grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Incidents feed */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold text-foreground">Лента инцидентов</h2>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {openIncidents.length} открытых
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {mockIncidents.slice(0, 5).map((incident) => (
              <div
                key={incident.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
              >
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  incident.priority === 'critical' ? 'bg-destructive animate-status-pulse' :
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
                  <p className="text-xs text-muted-foreground">{incident.objectName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-muted-foreground">{formatTime(incident.createdAt)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(incident.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active patrols */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Route className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Обходы</h2>
          </div>
          <div className="space-y-3 p-4">
            {mockPatrols.map((patrol) => {
              const progress = Math.round((patrol.completedCheckpoints / patrol.checkpoints) * 100);
              return (
                <div key={patrol.id} className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">{patrol.routeName}</p>
                    <Badge
                      variant={
                        patrol.status === 'completed' ? 'success' :
                        patrol.status === 'in_progress' ? 'default' :
                        patrol.status === 'overdue' ? 'destructive' : 'secondary'
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {patrol.status === 'completed' ? 'Завершён' :
                       patrol.status === 'in_progress' ? 'В процессе' :
                       patrol.status === 'overdue' ? 'Просрочен' : 'Ожидание'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{patrol.objectName}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{patrol.guardName}</span>
                      <span className="font-mono text-foreground">{patrol.completedCheckpoints}/{patrol.checkpoints}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress === 100 ? 'bg-success' : 'bg-primary'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom section: chart + shifts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Weekly chart */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Недельная статистика</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(213, 94%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(213, 94%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
                <XAxis
                  dataKey="day"
                  stroke="hsl(215, 15%, 50%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(215, 15%, 50%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[85, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 40%, 10%)',
                    border: '1px solid hsl(222, 20%, 16%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 20%, 92%)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="compliance"
                  stroke="hsl(213, 94%, 55%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompliance)"
                  name="SLA %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active shifts */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Clock className="h-4 w-4 text-success" />
            <h2 className="text-sm font-semibold text-foreground">Активные смены</h2>
            <Badge variant="success" className="ml-auto text-[10px] px-1.5 py-0">
              {mockShifts.filter(s => s.status === 'active').length} на посту
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {mockShifts.filter(s => s.status === 'active').slice(0, 5).map((shift) => (
              <div key={shift.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                  <Shield className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{shift.guardName}</p>
                  <p className="text-xs text-muted-foreground truncate">{shift.postName} — {shift.objectName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs text-foreground">
                    {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                  </p>
                  {shift.violations > 0 && (
                    <Badge variant="destructive" className="mt-0.5 text-[10px] px-1.5 py-0">
                      {shift.violations} наруш.
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}