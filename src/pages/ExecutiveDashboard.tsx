import { AppLayout } from '@/components/layout/AppLayout';
import {
  Building2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  incidentsOverTime,
  incidentsByObject,
  incidentTypeDistribution,
  performanceByUnit,
  slaTrend,
} from '@/data/executive-mock-data';
import { dashboardStats } from '@/data/mock-data';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: 'hsl(222, 40%, 10%)',
  border: '1px solid hsl(222, 20%, 16%)',
  borderRadius: '8px',
  color: 'hsl(210, 20%, 92%)',
  fontSize: '12px',
};

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
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
      <div className="mt-3 flex items-end gap-2">
        <span className="font-mono text-3xl font-bold text-foreground">{value}</span>
        {subtitle && <span className="mb-0.5 text-xs text-muted-foreground">{subtitle}</span>}
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

export default function ExecutiveDashboard() {
  const totalIncidents = incidentsByObject.reduce((sum, o) => sum + o.incidents, 0);
  const highRiskCount = 2; // critical + high from mock

  return (
    <AppLayout title="Стратегический обзор">
      {/* Top KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Активные объекты"
          value={dashboardStats.activeObjects}
          icon={Building2}
          trend="+2 за месяц"
          trendUp
          accent="bg-primary/10 text-primary"
        />
        <KPICard
          title="Инциденты (период)"
          value={totalIncidents}
          subtitle="за 30 дней"
          icon={AlertTriangle}
          trend="-12% к пр. мес."
          trendUp
          accent="bg-warning/10 text-warning"
        />
        <KPICard
          title="Средний SLA"
          value={`${dashboardStats.slaCompliance}%`}
          icon={Target}
          trend="+1.2%"
          trendUp
          accent="bg-success/10 text-success"
        />
        <KPICard
          title="Высокий риск"
          value={highRiskCount}
          subtitle="объектов"
          icon={ShieldAlert}
          accent="bg-destructive/10 text-destructive"
        />
        <KPICard
          title="Тренд инцидентов"
          value="↓"
          subtitle="снижение"
          icon={TrendingDown}
          trend="-3 к пр. нед."
          trendUp
          accent="bg-success/10 text-success"
        />
      </div>

      {/* Row 1: Incidents Over Time + SLA Trend */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Incidents Over Time */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Инциденты за период</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={incidentsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
                <XAxis dataKey="date" stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(38, 92%, 50%)', r: 4 }}
                  name="Инциденты"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Compliance Trend */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Target className="h-4 w-4 text-success" />
            <h2 className="text-sm font-semibold text-foreground">Тренд SLA</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={slaTrend}>
                <defs>
                  <linearGradient id="slaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
                <XAxis dataKey="period" stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[85, 100]} stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(152, 60%, 40%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#slaGrad)"
                  name="SLA %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Incidents by Object + Type Distribution */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Incidents by Object - bar chart */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">Инциденты по объектам</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentsByObject} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" horizontal={false} />
                <XAxis type="number" stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="object" stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} width={140} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="incidents" fill="hsl(213, 94%, 55%)" radius={[0, 4, 4, 0]} name="Инциденты" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Type Distribution - donut */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Типы инцидентов</h2>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={incidentTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {incidentTypeDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center gap-4">
              {incidentTypeDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="font-mono text-xs font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Performance by Unit */}
      <div className="mt-6 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Эффективность по подразделениям</h2>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={performanceByUnit}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
              <XAxis dataKey="unit" stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[70, 100]} stroke="hsl(215, 15%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sla" fill="hsl(213, 94%, 55%)" radius={[4, 4, 0, 0]} name="SLA" />
              <Bar dataKey="patrols" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} name="Обходы" />
              <Bar dataKey="discipline" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Дисциплина" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-6">
            {[
              { label: 'SLA', color: 'hsl(213, 94%, 55%)' },
              { label: 'Обходы', color: 'hsl(152, 60%, 40%)' },
              { label: 'Дисциплина', color: 'hsl(38, 92%, 50%)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
