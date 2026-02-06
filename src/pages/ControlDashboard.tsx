import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import {
  Gauge,
  Users,
  Clock,
  Route,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';
import {
  controlDashboardStats,
  slaByObject,
  incidentsByObjectForControl,
} from '@/data/executive-mock-data';
import { mockShifts, mockPatrols } from '@/data/mock-data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: 'hsl(222, 40%, 10%)',
  border: '1px solid hsl(222, 20%, 16%)',
  borderRadius: '8px',
  color: 'hsl(210, 20%, 92%)',
  fontSize: '12px',
};

function MetricCard({
  title,
  value,
  suffix,
  icon: Icon,
  trend,
  trendUp,
  accent,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-end gap-1">
        <span className="font-mono text-3xl font-bold text-foreground">{value}</span>
        {suffix && <span className="mb-0.5 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {trend && (
        <span className={`mt-1 flex items-center text-xs font-medium ${trendUp ? 'text-success' : 'text-destructive'}`}>
          {trendUp ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
          {trend}
        </span>
      )}
    </div>
  );
}

export default function ControlDashboard() {
  const lateShifts = mockShifts.filter((s) => s.violations > 0);
  const activePatrols = mockPatrols.filter((p) => p.status === 'in_progress' || p.status === 'pending');

  return (
    <AppLayout title="Панель управления">
      {/* Top KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Покрытие смен"
          value={controlDashboardStats.shiftCoverage}
          suffix="%"
          icon={Users}
          trend="+2% к пр. нед."
          trendUp
          accent="bg-primary/10 text-primary"
        />
        <MetricCard
          title="Опоздания"
          value={controlDashboardStats.lateShifts}
          icon={Clock}
          accent="bg-warning/10 text-warning"
        />
        <MetricCard
          title="Пропущено смен"
          value={controlDashboardStats.missedShifts}
          icon={AlertTriangle}
          accent="bg-destructive/10 text-destructive"
        />
        <MetricCard
          title="Обходы выполн."
          value={controlDashboardStats.patrolCompletion}
          suffix="%"
          icon={Route}
          trend="+4%"
          trendUp
          accent="bg-success/10 text-success"
        />
        <MetricCard
          title="Нарушения перс."
          value={controlDashboardStats.personnelViolations}
          icon={ShieldAlert}
          trend="-2 к пр. нед."
          trendUp
          accent="bg-warning/10 text-warning"
        />
        <MetricCard
          title="Активных объектов"
          value={controlDashboardStats.activeObjectsCount}
          icon={Gauge}
          accent="bg-primary/10 text-primary"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* SLA by Object */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">SLA по объектам</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={slaByObject} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" horizontal={false} />
                <XAxis type="number" domain={[80, 100]} stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="object" stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sla" radius={[0, 4, 4, 0]} name="SLA %">
                  {slaByObject.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.sla >= entry.target ? 'hsl(152, 60%, 40%)' : 'hsl(38, 92%, 50%)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Object */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">Инциденты по объектам</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={incidentsByObjectForControl} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" horizontal={false} />
                <XAxis type="number" stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="object" stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="open" stackId="a" fill="hsl(0, 72%, 51%)" name="Открытые" radius={[0, 0, 0, 0]} />
                <Bar dataKey="resolved" stackId="a" fill="hsl(38, 92%, 50%)" name="Решённые" />
                <Bar dataKey="closed" stackId="a" fill="hsl(152, 60%, 40%)" name="Закрытые" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center justify-center gap-4">
              {[
                { label: 'Открытые', color: 'bg-destructive' },
                { label: 'Решённые', color: 'bg-warning' },
                { label: 'Закрытые', color: 'bg-success' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Shift violations + Active patrols */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Shifts with violations */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold text-foreground">Смены с нарушениями</h2>
            </div>
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
              {lateShifts.length}
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {lateShifts.length > 0 ? lateShifts.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{shift.guardName}</p>
                  <p className="text-xs text-muted-foreground">{shift.postName} — {shift.objectName}</p>
                </div>
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {shift.violations} наруш.
                </Badge>
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Нарушений нет</div>
            )}
          </div>
        </div>

        {/* Active patrols */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Текущие обходы</h2>
            </div>
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              {activePatrols.length}
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {activePatrols.map((patrol) => {
              const progress = Math.round((patrol.completedCheckpoints / patrol.checkpoints) * 100);
              return (
                <div key={patrol.id} className="px-5 py-3 transition-colors hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{patrol.routeName}</p>
                      <p className="text-xs text-muted-foreground">{patrol.guardName} — {patrol.objectName}</p>
                    </div>
                    <span className="font-mono text-xs text-foreground">
                      {patrol.completedCheckpoints}/{patrol.checkpoints}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${progress === 100 ? 'bg-success' : 'bg-primary'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
