import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Route, Target } from 'lucide-react';
import { clientObjects } from '@/data/client-mock-data';

const riskColors = {
  low: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
  critical: 'bg-destructive/20 text-destructive',
};

const riskLabels = { low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический' };

export default function ClientMyObjects() {
  return (
    <AppLayout title="Мои объекты">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clientObjects.map((obj) => {
          const patrolPct = obj.todayPatrolsTotal > 0
            ? Math.round((obj.todayPatrolsCompleted / obj.todayPatrolsTotal) * 100)
            : 0;

          return (
            <div key={obj.id} className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{obj.name}</h3>
                    <p className="text-xs text-muted-foreground">{obj.address}</p>
                  </div>
                </div>
                <Badge className={`text-[10px] ${riskColors[obj.riskLevel]}`}>
                  {riskLabels[obj.riskLevel]}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-md bg-muted/50 p-2.5 text-center">
                  <Users className="mx-auto h-4 w-4 text-primary" />
                  <p className="mt-1 font-mono text-lg font-bold text-foreground">
                    {obj.guardsOnDuty}<span className="text-xs text-muted-foreground">/{obj.totalGuards}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">На смене</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2.5 text-center">
                  <Route className="mx-auto h-4 w-4 text-success" />
                  <p className="mt-1 font-mono text-lg font-bold text-foreground">{patrolPct}%</p>
                  <p className="text-[10px] text-muted-foreground">Обходы</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2.5 text-center">
                  <Target className="mx-auto h-4 w-4 text-warning" />
                  <p className="mt-1 font-mono text-lg font-bold text-foreground">{obj.slaCompliance}%</p>
                  <p className="text-[10px] text-muted-foreground">SLA</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
