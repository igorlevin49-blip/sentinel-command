import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Clock, Route, Users, Download } from 'lucide-react';
import { slaMetrics } from '@/data/client-mock-data';
import {
  BarChart,
  Bar,
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

function MetricCard({ title, value, suffix, icon: Icon, accent }: {
  title: string; value: string | number; suffix?: string; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <p className="mt-2 font-mono text-3xl font-bold text-foreground">
        {value}{suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}

export default function ClientSLAReports() {
  const m = slaMetrics;

  return (
    <AppLayout title="SLA и отчёты">
      {/* Export buttons */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" /> Экспорт PDF
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" /> Экспорт CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Общий SLA" value={m.overallSLA} suffix="%" icon={Target} accent="bg-success/10 text-success" />
        <MetricCard title="Ср. реагирование" value={m.avgResponseTimeMin} suffix=" мин" icon={Clock} accent="bg-primary/10 text-primary" />
        <MetricCard title="Медиана реаг." value={m.medianResponseTimeMin} suffix=" мин" icon={Clock} accent="bg-primary/10 text-primary" />
        <MetricCard title="Макс. реаг." value={m.maxResponseTimeMin} suffix=" мин" icon={Clock} accent="bg-warning/10 text-warning" />
        <MetricCard title="Обходы" value={m.patrolCompletionPct} suffix="%" icon={Route} accent="bg-success/10 text-success" />
        <MetricCard title="Дисциплина" value={m.shiftDisciplinePct} suffix="%" icon={Users} accent="bg-primary/10 text-primary" />
      </div>

      {/* Monthly chart */}
      <div className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Динамика по месяцам</h2>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={m.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
              <XAxis dataKey="month" stroke="hsl(215, 15%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[80, 100]} stroke="hsl(215, 15%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: 'hsl(215, 15%, 50%)' }}
              />
              <Bar dataKey="sla" fill="hsl(213, 94%, 55%)" radius={[4, 4, 0, 0]} name="SLA %" />
              <Bar dataKey="patrols" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} name="Обходы %" />
              <Bar dataKey="discipline" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Дисциплина %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
}
