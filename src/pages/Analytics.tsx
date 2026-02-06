import { AppLayout } from '@/components/layout/AppLayout';
import { weeklyData, dashboardStats, mockIncidents } from '@/data/mock-data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, Target, Clock, ShieldCheck } from 'lucide-react';

const incidentsByType = [
  { name: 'Тревога', value: mockIncidents.filter(i => i.type === 'alarm').length, color: 'hsl(0, 72%, 51%)' },
  { name: 'Нарушение', value: mockIncidents.filter(i => i.type === 'violation').length, color: 'hsl(38, 92%, 50%)' },
  { name: 'Событие', value: mockIncidents.filter(i => i.type === 'event').length, color: 'hsl(213, 94%, 55%)' },
];

const slaData = [
  { metric: 'Время реакции', value: 94, target: 95 },
  { metric: 'Обходы', value: 97, target: 95 },
  { metric: 'Дисциплина', value: 92, target: 90 },
  { metric: 'Отчётность', value: 98, target: 95 },
];

export default function Analytics() {
  return (
    <AppLayout title="Аналитика и SLA">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'SLA выполнение', value: `${dashboardStats.slaCompliance}%`, icon: Target, color: 'text-primary' },
          { title: 'Ср. время реакции', value: '4.2 мин', icon: Clock, color: 'text-success' },
          { title: 'Обходы за неделю', value: '129', icon: TrendingUp, color: 'text-warning' },
          { title: 'Без нарушений', value: '89%', icon: ShieldCheck, color: 'text-success' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-sm text-muted-foreground">{kpi.title}</span>
            </div>
            <p className="mt-2 font-mono text-3xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Incidents bar chart */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Инциденты за неделю</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
                <XAxis dataKey="day" stroke="hsl(215, 15%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215, 15%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 40%, 10%)',
                    border: '1px solid hsl(222, 20%, 16%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 20%, 92%)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="incidents" fill="hsl(213, 94%, 55%)" radius={[4, 4, 0, 0]} name="Инциденты" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by type */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Инциденты по типу</h2>
          </div>
          <div className="flex items-center justify-center p-4">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={incidentsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {incidentsByType.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 40%, 10%)',
                    border: '1px solid hsl(222, 20%, 16%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 20%, 92%)',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {incidentsByType.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="font-mono text-xs font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SLA metrics */}
        <div className="rounded-lg border border-border bg-card lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Метрики SLA</h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {slaData.map((item) => {
              const isAboveTarget = item.value >= item.target;
              return (
                <div key={item.metric} className="rounded-md border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">{item.metric}</p>
                  <div className="mt-2 flex items-end gap-1">
                    <span className={`font-mono text-2xl font-bold ${isAboveTarget ? 'text-success' : 'text-warning'}`}>
                      {item.value}%
                    </span>
                    <span className="mb-0.5 text-xs text-muted-foreground">/ {item.target}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${isAboveTarget ? 'bg-success' : 'bg-warning'}`}
                      style={{ width: `${item.value}%` }}
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